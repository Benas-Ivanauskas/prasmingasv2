-- Trip.isLastMinute -- admin'o rankinis perjungiklis "Paskutinės minutės"
-- ženkliukui ant kortelės nuotraukos (TripCard.tsx), nepriklausomas nuo
-- esamo laisvo teksto Trip.badgeTag.
ALTER TABLE "Trip" ADD COLUMN "isLastMinute" BOOLEAN NOT NULL DEFAULT false;
