export const PHONE_PREFIX = "+370 ";

// For fields that must never contain whitespace (email, personal code,
// passport number, etc.) — strips ALL spaces, not just leading/trailing
// (unlike .trim()), so e.g. "123 4567" can't slip through as a personal code.
export function stripSpaces(value: string): string {
  return value.replace(/\s+/g, "");
}

// ASCII only on purpose: no Lithuanian letters (ą, č, ę, ė, į, š, ų, ū, ž),
// no other accented/non-Latin characters, no spaces — those break mail
// delivery and downstream systems (payment provider, invoices).
const EMAIL_RE =
  /^[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

export function isValidEmail(value: string): boolean {
  const email = value.trim();
  return email.length <= 254 && !email.includes("..") && EMAIL_RE.test(email);
}

// Human-readable reason an address is rejected, or null when it is valid.
export function getEmailError(value: string): string | null {
  const email = value.trim();
  if (isValidEmail(email)) return null;
  if (/\P{ASCII}/u.test(email)) {
    return "El. paštas negali turėti lietuviškų ar kitų specialių raidžių (ą, č, ę, ė, š, ž ir pan.)";
  }
  if (/\s/.test(email)) return "El. paštas negali turėti tarpų";
  return "Įveskite teisingą el. pašto adresą";
}

// Keeps the fixed "+370 " prefix and formats whatever the user types as
// "+370 6xx xxxxx" (8 national digits). Pasting "+370…", "8…", "370…" or
// spaced/dashed numbers all normalize to the same shape.
export function formatLtPhone(input: string): string {
  // Backspacing into the prefix just resets to it.
  if ("+370".startsWith(input)) return PHONE_PREFIX;
  // The field always starts with the fixed "+370" prefix, so what the user
  // typed or pasted is whatever follows it.
  let rest = input.startsWith("+370") ? input.slice(4) : input;
  // Pasted full numbers: "+370 6…" / "00370 6…" / "8 6…" collapse to national digits.
  rest = rest.trim().replace(/^(\+370|00370)/, "");
  let digits = rest.replace(/\D/g, "");
  if (digits.length === 9 && digits.startsWith("8")) digits = digits.slice(1);
  if (digits.length === 11 && digits.startsWith("370")) digits = digits.slice(3);
  digits = digits.slice(0, 8);
  const head = digits.slice(0, 3);
  const tail = digits.slice(3);
  return PHONE_PREFIX + (tail ? `${head} ${tail}` : head);
}

export function isValidLtPhone(value: string): boolean {
  return /^\+370 \d{3} \d{5}$/.test(value);
}
