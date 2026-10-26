-- Document(orderId, type) unique -- DB lygmens garantija, kad tam pačiam
-- užsakymui tas pats dokumento tipas niekada negeneruojamas/numeruojamas
-- du kartus (žr. invoice.service.ts::getOrCreateInvoiceNumber).
CREATE UNIQUE INDEX "Document_orderId_type_key" ON "Document"("orderId", "type");
