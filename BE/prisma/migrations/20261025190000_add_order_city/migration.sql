-- Order.city — kliento paties įvestas gyvenamasis miestas (Step 3 formoje,
-- PRIVALOMAS ten), kurio iki šiol niekada nebuvo priimama į backend'ą
-- (checkoutOrder() jo nesiuntė, Order modelis jo neturėjo — duomenys buvo
-- tyliai prarandami). Nullable, nes admin'o rankinio užsakymo forma šio
-- lauko neturi ir senų užsakymų ši reikšmė niekada nebus atgaline data
-- atkurta.
ALTER TABLE "Order" ADD COLUMN "city" TEXT;
