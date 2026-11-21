-- Trip.badgeTag / Trip.isLastMinute buvo nustatomi VISAI kelionei, bet
-- kelionė rodoma kortelėse PER IŠVYKIMĄ (viena kelionė = kelios datos =
-- kelios kortelės) — dėl to pažymėjus "Paskutinė minutė" vienai datai,
-- ženkliukas klaidingai rodydavosi VISŲ tos kelionės datų kortelėse.
-- Perkeliame abu laukus į Departure, backfill'indami esamą Trip reikšmę
-- į visas jos išvykimo datas, kad esamas vaizdas nepasikeistų iki admin
-- pats perredaguos konkrečias datas.

ALTER TABLE "Departure" ADD COLUMN "badgeTag" TEXT;
ALTER TABLE "Departure" ADD COLUMN "isLastMinute" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Departure" d
SET "badgeTag" = t."badgeTag",
    "isLastMinute" = t."isLastMinute"
FROM "Trip" t
WHERE d."tripId" = t."id";

ALTER TABLE "Trip" DROP COLUMN "badgeTag";
ALTER TABLE "Trip" DROP COLUMN "isLastMinute";
