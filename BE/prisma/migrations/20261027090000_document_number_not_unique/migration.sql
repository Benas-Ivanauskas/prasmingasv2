-- Document.number buvo klaidingai @unique per visą lentelę — bet sąskaitos
-- numeris priklauso UŽSAKYMUI, ne dokumento tipui: FULL arba DEPOSIT+
-- REMAINING pora tam pačiam užsakymui (vėliau ir VAT_INVOICE) dalijasi
-- TUO PAČIU numeriu, tad kelios Document eilutės TYČIA turi tą pačią
-- "number" reikšmę, kai jos priklauso tam pačiam orderId.
DROP INDEX "Document_number_key";
