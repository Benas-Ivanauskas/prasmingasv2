import { IoAirplaneOutline, IoBusOutline, IoBoatOutline } from "react-icons/io5";
import type { TripType } from "../../types/trip";

export default function TripTypeIcon({ type }: { type: TripType }) {
  switch (type) {
    case "FLIGHT":
      return <IoAirplaneOutline aria-hidden="true" />;
    case "CRUISE":
      return <IoBoatOutline aria-hidden="true" />;
    case "BUS":
    default:
      return <IoBusOutline aria-hidden="true" />;
  }
}
