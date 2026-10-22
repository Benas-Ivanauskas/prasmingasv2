-- Order.orderNumber (@unique "PR-<metai>-<00042>") generavimui — nieko
-- Prisma schema DSL'e tam nebuvo (Trip.nextInvoiceNumber yra ATSKIRAS,
-- Document numeravimo skaitiklis, Fazė 6 sritis). Seka ne transakcinė
-- (Postgres dizainas) — nesėkmingas/pakartotas checkout tiesiog palieka
-- mažą numeravimo tarpą, tai normalu užsakymų numeriams.
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Paskutinė gynybos linija po order.service.ts'o raw SQL UPDATE sąlygų
-- (takenUnits + qty <= totalUnits / flightSeatsTaken + count <= flightSeatsTotal)
-- — niekada neturėtų suveikti, jei checkout transakcijos logika teisinga,
-- bet garantuoja, kad DB pati atmestų bet kokį būsimą kodą, kuris pamirštų
-- sąlyginį patikrinimą.
ALTER TABLE "CabinType" ADD CONSTRAINT cabintype_taken_within_total CHECK ("takenUnits" <= "totalUnits");
ALTER TABLE "Departure" ADD CONSTRAINT departure_flightseats_within_total
  CHECK ("flightSeatsTotal" IS NULL OR "flightSeatsTaken" <= "flightSeatsTotal");
