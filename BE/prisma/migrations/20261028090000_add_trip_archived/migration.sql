-- Trip.archived -- kai admin paspaudžia "Ištrinti" kelionei, kuri turi
-- susijusių užsakymų (net atšauktų/testinių), tikras ištrynimas neįmanomas
-- (Order->Departure FK) ir anksčiau buvo tyliai pakeičiamas isActive=false
-- pažymėjimu, bet kelionė VIS TIEK likdavo matoma admin'o kelionių sąraše
-- ("Paslėpta"), todėl pakartotinis "Ištrinti" paspaudimas atrodė, lyg
-- nieko nevyktų. archived=true PAPILDOMAI pažymima tuo pačiu atveju ir
-- paslepia kelionę iš admin'o sąrašo VISAI (žr. adminTrip.service.ts::
-- listAdminTrips/deleteAdminTrip) -- duomenys DB'je lieka nepaliesti.
ALTER TABLE "Trip" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;
