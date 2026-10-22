// Paysera integracijos modulis — PATVIRTINTA veikiančia logika iš ankstesnio
// (realiai produkcijoje veikusio) projekto, pritaikyta mūsų Prisma/TS
// architektūrai. `verifyAndParseCallback`/`mapPayseraStatus` parašyti dabar
// (modulis turi juos palaikyti), bet šią fazę niekas jų nekviečia — tai
// Fazės 6 (webhook) darbas.
import crypto from "node:crypto";
import { env } from "../config/env.js";

function toUrlSafeBase64(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
}

function fromUrlSafeBase64(value: string): Buffer {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export interface CreatePaymentUrlInput {
  orderId: string; // providerOrderId, pvz. "ord_<orderId>_deposit"
  amountCents: number;
  description: string;
  accepturl: string;
  cancelurl: string;
}

export function createPaymentUrl(input: CreatePaymentUrlInput): string {
  const params: Record<string, string> = {
    projectid: env.paysera.projectId,
    orderid: input.orderId,
    accepturl: input.accepturl,
    cancelurl: input.cancelurl,
    callbackurl: `${env.paysera.baseUrl}/api/webhooks/paysera`,
    amount: String(input.amountCents),
    currency: "EUR",
    test: env.paysera.testMode ? "1" : "0",
    description: input.description,
    version: "1.6",
  };

  const sortedKeys = Object.keys(params).sort();
  const query = sortedKeys.map((key) => `${key}=${encodeURIComponent(params[key]!)}`).join("&");
  const data = toUrlSafeBase64(Buffer.from(query, "utf8"));
  const sign = crypto.createHash("md5").update(data + env.paysera.signPassword).digest("hex");

  return `https://www.paysera.com/pay/?data=${data}&sign=${sign}`;
}

export type PayseraCallbackParams = Record<string, string>;

// RSA/ss2 patikra NEBŪTINA — ankstesniame projekte naudota TIK ss1/MD5, ir
// to visiškai pakako produkcijoje.
export function verifyAndParseCallback(data: string, ss1: string): PayseraCallbackParams {
  const expected = crypto.createHash("md5").update(data + env.paysera.signPassword).digest("hex");
  if (expected !== ss1) {
    throw new Error("Paysera parašas neatitinka (signature mismatch)");
  }

  const query = fromUrlSafeBase64(data).toString("utf8");
  const result: PayseraCallbackParams = {};
  for (const pair of query.split("&")) {
    const [key, value] = pair.split("=");
    if (key) result[key] = decodeURIComponent(value ?? "");
  }
  return result;
}

export function mapPayseraStatus(status: string): "COMPLETED" | "FAILED" | "PENDING" {
  if (status === "1" || status === "3" || status === "4") return "COMPLETED";
  if (status === "0") return "FAILED";
  return "PENDING";
}
