export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// BE atitikmuo FE's richTextUtils.ts::toRichHtml — ta pati logika (be DOM
// priklausomybės, nereikalinga čia): senas turinys (paprastas tekstas arba
// string[]) ir naujas admin rich-text redaktoriaus HTML abu paverčiami į
// HTML, kurį PDF šablonas gali tiesiog įterpti. Sanitizavimo (DOMPurify)
// čia TYČIA nėra — turinys visada admin'o įvestas (patikimas principal'as),
// o renderinama IZOLIUOTAME Puppeteer puslapyje, ne mūsų pačių svetainėje.
export function toRichHtml(value: unknown): string {
  if (!value) return "";

  if (Array.isArray(value)) {
    const items = value.map((v) => String(v).trim()).filter(Boolean);
    return items.length ? `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>` : "";
  }

  const str = String(value);
  if (/^\s*</.test(str)) return str;

  return str
    .split(/\n{2,}|\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}
