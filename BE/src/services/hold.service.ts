import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";
import { ApiError } from "../middleware/errorHandler.js";
import type { HoldInput } from "./hold.schemas.js";

export interface HoldResult {
  holdId: string;
  expiresAt: number; // Unix ms timestamp — FE useCountdown.ts atima tiesiogiai iš Date.now()
}

const HOLD_TTL_SECONDS = 15 * 60;
const HOLD_TTL_MS = HOLD_TTL_SECONDS * 1000;

function seatKey(departureId: string, seatId: string): string {
  return `hold:${departureId}:${seatId}`;
}

function flightKey(departureId: string, holdId: string): string {
  return `hold:${departureId}:flight:${holdId}`;
}

function flightPattern(departureId: string): string {
  return `hold:${departureId}:flight:*`;
}

// CRUISE kajutės — laikomos pagal cabinTypeId (ne pagal vieną bendrą
// departure-lygio skaitiklį kaip FLIGHT), nes skirtingi kajučių tipai turi
// nepriklausomą likutį. Vienas raktas per holdId (keli hold'ai gali laikyti
// tą patį tipą vienu metu — sumuojama per pattern'ą, kaip ir FLIGHT).
function cabinKey(departureId: string, cabinTypeId: string, holdId: string): string {
  return `hold:${departureId}:cabin:${cabinTypeId}:${holdId}`;
}

function cabinPattern(departureId: string, cabinTypeId: string): string {
  return `hold:${departureId}:cabin:${cabinTypeId}:*`;
}

function metaKey(holdId: string): string {
  return `holdmeta:${holdId}`;
}

// Atominis, apjungtas BUS/CRUISE skriptas — vienu EVAL vykdymu patikrina IR
// vietas (EXISTS kiekvienai), IR kiekvieną pasirinktą kajučių tipą (KEYS
// pattern + suma prieš talpą), tada arba viską SET (vietas + kajučių
// skaitiklius + holdmeta), arba nieko (return 0) — joks "pusinis" tarpinis
// būvis niekada nestebimas. Su 0 kajučių grupių veikia identiškai senam
// grynam vietų skriptui (BUS atvejis).
// KEYS: [1..numSeatKeys] vietos raktai, [numSeatKeys+1..+numCabinGroups]
//       kajučių skaitiklių raktai (po vieną grupei), paskutinis — holdmeta.
// ARGV: [1]=holdId [2]=ttlSeconds [3]=metaJson [4]=numSeatKeys
//       [5]=numCabinGroups, tada kiekvienai grupei po 3: pattern, qty, cap.
const COMBINED_HOLD_SCRIPT = `
local numSeatKeys = tonumber(ARGV[4])
local numCabinGroups = tonumber(ARGV[5])

for i = 1, numSeatKeys do
  if redis.call('EXISTS', KEYS[i]) == 1 then
    return 0
  end
end

for g = 1, numCabinGroups do
  local base = 5 + (g - 1) * 3
  local pattern = ARGV[base + 1]
  local qty = tonumber(ARGV[base + 2])
  local cap = tonumber(ARGV[base + 3])
  local existing = redis.call('KEYS', pattern)
  local sum = 0
  for _, k in ipairs(existing) do
    local v = redis.call('GET', k)
    if v then sum = sum + tonumber(v) end
  end
  if sum + qty > cap then
    return 0
  end
end

for i = 1, numSeatKeys do
  redis.call('SET', KEYS[i], ARGV[1], 'EX', ARGV[2])
end
for g = 1, numCabinGroups do
  local base = 5 + (g - 1) * 3
  redis.call('SET', KEYS[numSeatKeys + g], ARGV[base + 2], 'EX', ARGV[2])
end
redis.call('SET', KEYS[numSeatKeys + numCabinGroups + 1], ARGV[3], 'EX', ARGV[2])
return 1
`;

// Atominis: pats skriptas susumuoja esamus laikomus kiekius (KEYS pattern +
// GET kiekvienam) ir patikrina, ar tilpsta, prieš rašydamas — visa tai
// viename EVAL vykdyme.
const FLIGHT_HOLD_SCRIPT = `
local existing = redis.call('KEYS', ARGV[1])
local sum = 0
for _, k in ipairs(existing) do
  local v = redis.call('GET', k)
  if v then sum = sum + tonumber(v) end
end
if sum + tonumber(ARGV[2]) > tonumber(ARGV[3]) then
  return 0
end
redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[4])
redis.call('SET', KEYS[2], ARGV[5], 'EX', ARGV[4])
return 1
`;

// BUS: tik seatIds. CRUISE: seatIds (autobuso perkėlimo vietos) KARTU su
// cabinSelections (kajučių tipai) — vienas atominis hold'as abiem iš karto,
// atlaisvinamas kartu (žr. releaseHold žemiau).
async function createSeatAndCabinHold(
  departureId: string,
  seatIds: string[],
  cabinSelections: Record<string, number>,
): Promise<HoldResult> {
  // Postgres pre-patikra — draugiškas, ankstyvas atmetimas; TIKROJI apsauga
  // nuo persidengiančio pardavimo vis tiek ateis iš Fazė 5 checkout
  // transakcijos atominio UPDATE, ne iš čia.
  if (seatIds.length > 0) {
    const seats = await prisma.seat.findMany({ where: { id: { in: seatIds } } });
    if (seats.length !== seatIds.length) {
      throw new ApiError(404, "Viena ar kelios vietos nerastos");
    }
    const invalidSeat = seats.find((s) => s.departureId !== departureId || s.status !== "FREE");
    if (invalidSeat) {
      throw new ApiError(409, `Vieta ${invalidSeat.seatNumber} nebeprieinama`);
    }
  }

  const cabinTypeIds = Object.keys(cabinSelections);
  const cabinCaps = new Map<string, number>();
  if (cabinTypeIds.length > 0) {
    const cabins = await prisma.cabinType.findMany({ where: { id: { in: cabinTypeIds } } });
    if (cabins.length !== cabinTypeIds.length) {
      throw new ApiError(404, "Viena ar kelios kajutės nerastos");
    }
    for (const cabin of cabins) {
      if (cabin.departureId !== departureId) {
        throw new ApiError(409, "Kajutė nepriklauso šiam išvykimui");
      }
      cabinCaps.set(cabin.id, cabin.totalUnits - cabin.takenUnits);
    }
  }

  const holdId = crypto.randomUUID();
  const seatKeys = seatIds.map((seatId) => seatKey(departureId, seatId));
  const cabinKeys = cabinTypeIds.map((cabinTypeId) => cabinKey(departureId, cabinTypeId, holdId));
  const meta = JSON.stringify({
    departureId,
    ...(seatIds.length > 0 ? { seatIds } : {}),
    ...(cabinTypeIds.length > 0 ? { cabinSelections } : {}),
  });

  const cabinArgs = cabinTypeIds.flatMap((cabinTypeId) => [
    cabinPattern(departureId, cabinTypeId),
    cabinSelections[cabinTypeId],
    // Pagarantuota aukščiau — kiekvienas cabinTypeIds narys atitinka rastą
    // CabinType įrašą (kitaip jau būtų išmesta ApiError 404/409 anksčiau).
    cabinCaps.get(cabinTypeId)!,
  ]);

  const result = await redis.eval(
    COMBINED_HOLD_SCRIPT,
    seatKeys.length + cabinKeys.length + 1,
    ...seatKeys,
    ...cabinKeys,
    metaKey(holdId),
    holdId,
    HOLD_TTL_SECONDS,
    meta,
    seatKeys.length,
    cabinTypeIds.length,
    ...cabinArgs,
  );

  if (result !== 1) {
    throw new ApiError(409, "Viena ar kelios pasirinktos vietos/kajutės ką tik buvo užimtos — pasirinkite iš naujo");
  }

  return { holdId, expiresAt: Date.now() + HOLD_TTL_MS };
}

async function createFlightHold(departureId: string, count: number): Promise<HoldResult> {
  const departure = await prisma.departure.findUnique({
    where: { id: departureId },
    select: { flightSeatsTotal: true, flightSeatsTaken: true },
  });
  if (!departure) {
    throw new ApiError(404, "Išvykimas nerastas");
  }

  const freeCount = (departure.flightSeatsTotal ?? 0) - departure.flightSeatsTaken;
  const holdId = crypto.randomUUID();
  const meta = JSON.stringify({ departureId, flightCount: count });

  const result = await redis.eval(
    FLIGHT_HOLD_SCRIPT,
    2,
    flightKey(departureId, holdId),
    metaKey(holdId),
    flightPattern(departureId),
    count,
    freeCount,
    HOLD_TTL_SECONDS,
    meta,
  );

  if (result !== 1) {
    throw new ApiError(409, "Nebeliko tiek laisvų bilietų — pasirinkite mažesnį kiekį arba bandykite vėliau");
  }

  return { holdId, expiresAt: Date.now() + HOLD_TTL_MS };
}

export async function createHold(departureId: string, input: HoldInput): Promise<HoldResult> {
  const departure = await prisma.departure.findUnique({
    where: { id: departureId },
    select: { trip: { select: { tripType: true } } },
  });
  if (!departure) {
    throw new ApiError(404, "Išvykimas nerastas");
  }

  if (input.flightCount) {
    if (departure.trip.tripType !== "FLIGHT") {
      throw new ApiError(400, "flightCount galimas tik FLIGHT tipo kelionėms");
    }
    return createFlightHold(departureId, input.flightCount);
  }

  if (departure.trip.tripType === "FLIGHT") {
    throw new ApiError(400, "Šis išvykimas neturi konkrečių vietų — naudokite flightCount");
  }
  return createSeatAndCabinHold(departureId, input.seatIds ?? [], input.cabinSelections ?? {});
}

export interface HoldMeta {
  departureId: string;
  seatIds?: string[];
  cabinSelections?: Record<string, number>;
  flightCount?: number;
}

// Naudojama order.service.ts'o checkout prieš-transakcinėje patikroje —
// palygina kliento pateiktą seatIds/cabinSelections/flightCount su tuo, kas
// REALIAI buvo laikoma šiuo holdId (papildoma apsauga, NE pagrindinė — ta
// ateina iš checkout transakcijos pačios atominio UPDATE).
export async function getHoldMeta(holdId: string): Promise<HoldMeta | null> {
  const metaRaw = await redis.get(metaKey(holdId));
  if (!metaRaw) return null;
  return JSON.parse(metaRaw) as HoldMeta;
}

export async function releaseHold(holdId: string): Promise<void> {
  const metaRaw = await redis.get(metaKey(holdId));
  if (!metaRaw) return; // jau pasibaigęs arba jau atlaisvintas — tylus no-op

  const meta = JSON.parse(metaRaw) as HoldMeta;

  const keysToDelete: string[] = [];
  if (meta.seatIds && meta.seatIds.length > 0) {
    keysToDelete.push(...meta.seatIds.map((seatId) => seatKey(meta.departureId, seatId)));
  }
  if (meta.cabinSelections) {
    keysToDelete.push(
      ...Object.keys(meta.cabinSelections).map((cabinTypeId) => cabinKey(meta.departureId, cabinTypeId, holdId)),
    );
  }
  if (meta.flightCount) {
    keysToDelete.push(flightKey(meta.departureId, holdId));
  }
  if (keysToDelete.length > 0) {
    await redis.del(...keysToDelete);
  }
  await redis.del(metaKey(holdId));
}

// Naudojama trip.service.ts'o viešos kelionės detalės atsakyme — sulieja
// Postgres Seat.status su aktyviais Redis hold'ais (vieta "FREE" Postgres'e,
// bet aktyviai laikoma Redis, klientui rodoma kaip "HELD").
export async function getHeldSeatIds(departureId: string, seatIds: string[]): Promise<Set<string>> {
  if (seatIds.length === 0) return new Set();
  const keys = seatIds.map((seatId) => seatKey(departureId, seatId));
  const values = await redis.mget(...keys);
  const held = new Set<string>();
  values.forEach((value, i) => {
    if (value) held.add(seatIds[i] as string);
  });
  return held;
}

export async function getHeldFlightCount(departureId: string): Promise<number> {
  const keys = await redis.keys(flightPattern(departureId));
  if (keys.length === 0) return 0;
  const values = await redis.mget(...keys);
  return values.reduce((sum: number, value) => sum + (value ? Number(value) : 0), 0);
}

// Naudojama trip.service.ts'o viešos kelionės detalės atsakyme CRUISE
// kajutėms — sulieja Postgres CabinType.takenUnits su aktyviais Redis
// hold'ais (analogiškai getHeldFlightCount, bet per cabinTypeId, ne vieną
// bendrą departure-lygio skaitiklį).
export async function getHeldCabinCount(departureId: string, cabinTypeId: string): Promise<number> {
  const keys = await redis.keys(cabinPattern(departureId, cabinTypeId));
  if (keys.length === 0) return 0;
  const values = await redis.mget(...keys);
  return values.reduce((sum: number, value) => sum + (value ? Number(value) : 0), 0);
}
