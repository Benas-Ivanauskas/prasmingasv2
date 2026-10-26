// Suma žodžiais lietuviškai (sąskaitų faktūrų "Suma žodžiais" eilutei).
// Pvz. amountInWords(203.6) → "Du šimtai trys eurai, 60 ct."
//
// BE atitikmuo FE tripHelpers.ts::pluralizeLt principui (skaičius→galūnė),
// bet čia reikalingas PILNAS skaičiaus užrašymas žodžiais, ne tik galūnė —
// laikoma atskirai, nes FE/BE nesidalina kodu (žr. lib/richText.ts komentarą).

const ONES = [
  "nulis", "vienas", "du", "trys", "keturi", "penki", "šeši", "septyni", "aštuoni", "devyni",
];
const TEENS = [
  "dešimt", "vienuolika", "dvylika", "trylika", "keturiolika",
  "penkiolika", "šešiolika", "septyniolika", "aštuoniolika", "devyniolika",
];
const TENS = [
  "", "", "dvidešimt", "trisdešimt", "keturiasdešimt",
  "penkiasdešimt", "šešiasdešimt", "septyniasdešimt", "aštuoniasdešimt", "devyniasdešimt",
];

// Ta pati taisyklė kaip FE pluralizeLt (0/10/11-19/bet kuris dešimtukas →
// kilmininkas daugiskaita), tik čia taikoma skaičiaus-žodžiams, ne daiktavardžiams.
function pluralizeLt(count: number, singular: string, pluralNominative: string, pluralGenitive: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return singular;
  if (mod10 >= 2 && mod10 <= 9 && !(mod100 >= 12 && mod100 <= 19)) return pluralNominative;
  return pluralGenitive;
}

// 0-999 → žodžiai, be skalės (tūkstantis/milijonas) žodžio.
function chunkToWords(n: number): string {
  if (n === 0) return "";
  const parts: string[] = [];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;

  if (hundreds > 0) {
    parts.push(hundreds === 1 ? "šimtas" : `${ONES[hundreds]} šimtai`);
  }

  if (rest > 0) {
    if (rest < 10) {
      parts.push(ONES[rest]);
    } else if (rest < 20) {
      parts.push(TEENS[rest - 10]);
    } else {
      const tens = Math.floor(rest / 10);
      const ones = rest % 10;
      parts.push(ones > 0 ? `${TENS[tens]} ${ONES[ones]}` : TENS[tens]);
    }
  }

  return parts.join(" ");
}

interface Scale {
  divisor: number;
  singular: string;
  pluralNominative: string;
  pluralGenitive: string;
  // "tūkstantis" praleidžia "vienas" prieš save (1000 = "tūkstantis", ne
  // "vienas tūkstantis") — lietuviška konvencija. Milijonui/milijardui ne.
  omitOneWord: boolean;
}

const SCALES: Scale[] = [
  { divisor: 1_000_000_000, singular: "milijardas", pluralNominative: "milijardai", pluralGenitive: "milijardų", omitOneWord: false },
  { divisor: 1_000_000, singular: "milijonas", pluralNominative: "milijonai", pluralGenitive: "milijonų", omitOneWord: false },
  { divisor: 1_000, singular: "tūkstantis", pluralNominative: "tūkstančiai", pluralGenitive: "tūkstančių", omitOneWord: true },
];

function integerToWords(n: number): string {
  if (n === 0) return "nulis";

  let remaining = n;
  const groups: string[] = [];

  for (const scale of SCALES) {
    const count = Math.floor(remaining / scale.divisor);
    remaining %= scale.divisor;
    if (count === 0) continue;
    const scaleWord = pluralizeLt(count, scale.singular, scale.pluralNominative, scale.pluralGenitive);
    groups.push(count === 1 && scale.omitOneWord ? scaleWord : `${chunkToWords(count)} ${scaleWord}`);
  }

  if (remaining > 0 || groups.length === 0) {
    groups.push(chunkToWords(remaining));
  }

  return groups.filter(Boolean).join(" ");
}

// Palaiko sumas iki ~999 999 999,99 € — realios kelionių kainos niekada
// nepriartėja prie šios ribos, bet funkcija nelūžta ir ties ja.
export function amountInWords(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const euros = Math.floor(rounded);
  const cents = Math.round((rounded - euros) * 100);

  const eurWord = pluralizeLt(euros, "euras", "eurai", "eurų");
  const eurosText = `${integerToWords(euros)} ${eurWord}`;
  const capitalized = eurosText.charAt(0).toUpperCase() + eurosText.slice(1);

  return `${capitalized}, ${String(cents).padStart(2, "0")} ct.`;
}
