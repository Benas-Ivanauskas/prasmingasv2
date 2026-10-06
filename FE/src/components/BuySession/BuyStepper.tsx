import "./BuyStepper.css";

const STEPS = ["Kelionė", "Vietos", "Keleiviai", "Mokėjimas"];

interface BuyStepperProps {
  currentStep: 1 | 2 | 3 | 4;
}

export default function BuyStepper({ currentStep }: BuyStepperProps) {
  return (
    <ol className="buy-stepper">
      {STEPS.map((label, idx) => {
        const stepNumber = idx + 1;
        const isCurrent = stepNumber === currentStep;
        const isDone = stepNumber < currentStep;

        return (
          <li
            key={label}
            className={`buy-stepper-item ${isCurrent ? "current" : ""} ${
              isDone ? "done" : ""
            }`}
          >
            <span className="buy-stepper-number">{stepNumber}</span>
            <span className="buy-stepper-label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
