import type { ReactNode } from "react";

export function Field({
  label,
  hint,
  children,
  wide,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`admin-field${wide ? " is-wide" : ""}`}>
      <span className="admin-field-label">{label}</span>
      {children}
      {hint && <span className="admin-field-hint">{hint}</span>}
    </label>
  );
}

export function NumberInput({
  value,
  onChange,
  min,
  step,
}: {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  min?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      min={min}
      step={step}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
    />
  );
}
