-- Order.companyName / Order.companyDetails — užpildoma tik kai klientas
-- nori PVM sąskaitos faktūros IR perka kaip įmonė (abu nullable, laisvas
-- tekstas). Naudojama generuojamuose dokumentuose vietoj pirmo keleivio
-- vardo, kai companyName užpildytas (žr. invoice.service.ts::buildInvoiceData).
ALTER TABLE "Order" ADD COLUMN "companyName" TEXT;
ALTER TABLE "Order" ADD COLUMN "companyDetails" TEXT;
