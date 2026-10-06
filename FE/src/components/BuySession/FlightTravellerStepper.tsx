import { IoAddCircle, IoRemoveCircle } from "react-icons/io5";
import "./FlightTravellerStepper.css";

interface FlightTravellerStepperProps {
  count: number;
  min: number;
  max: number;
  onChange: (count: number) => void;
}

export default function FlightTravellerStepper({
  count,
  min,
  max,
  onChange,
}: FlightTravellerStepperProps) {
  return (
    <div className="flight-stepper">
      <span className="flight-stepper-label">Keleivių skaičius</span>

      <div className="flight-stepper-control">
        <button
          type="button"
          className="flight-stepper-btn"
          onClick={() => onChange(count - 1)}
          disabled={count <= min}
          aria-label="Mažiau keleivių"
        >
          <IoRemoveCircle aria-hidden="true" />
        </button>

        <span className="flight-stepper-count">{count}</span>

        <button
          type="button"
          className="flight-stepper-btn"
          onClick={() => onChange(count + 1)}
          disabled={count >= max}
          aria-label="Daugiau keleivių"
        >
          <IoAddCircle aria-hidden="true" />
        </button>
      </div>

      <span className="flight-stepper-hint">Laisvų vietų: {max}</span>
    </div>
  );
}
