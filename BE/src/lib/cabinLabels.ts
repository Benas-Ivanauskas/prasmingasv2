import type { CabinTypeName } from "../services/orderPricing.service.js";

export type { CabinTypeName };

// Tas pats tekstas kaip FE tripHelpers.ts::getCabinTypeLabel — laikoma
// atskirai BE pusėje, nes FE/BE nesidalina kodu. Naudojama documents.service.ts
// (el. laiško tekstas), invoice.service.ts ir contract.service.ts (PDF priedai).
export function getCabinTypeLabel(type: CabinTypeName): string {
  switch (type) {
    case "DOUBLE":
      return "Dvivietė kajutė be lango";
    case "TRIPLE":
      return "Trivietė kajutė be lango";
    case "QUAD":
    default:
      return "Vieta keturvietėje kajutėje be lango";
  }
}
