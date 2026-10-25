import nodemailer from "nodemailer";
import { env } from "../config/env.js";

// Reali integracija — tas pats principas kaip Paysera: serveris paleidžiasi
// be tikrų SMTP kredencialų, bet sendMail() tada tiesiog mes klaidą
// natūraliai (kvietėjas ją traktuoja nefataliai, žr. adminOrder.service.ts).
//
// pool+rateLimit — apsauga nuo SMTP provider'io (Hostinger) throttling'o/
// laikino blokavimo, kai masiškai siunčiama daug laiškų iš eilės (pvz.
// sendRemainingPaymentReminders.job.ts cron'as su dešimtimis DEPOSIT_PAID
// užsakymų vienu metu, arba ateities PDF/dokumentų retry cron'as). Apribota
// VIENĄ KARTĄ čia, transporter'io lygyje — apsaugo VISUS siuntimo kelius
// (webhook'o patvirtinimo laiškus, admin'o rankinį siuntimą, automatinį
// cron'ą), be reikalo kiekvienam naujam masinio siuntimo vietoje atskirai
// prisiminti pridėti throttling'ą. 2 laiškai/sek yra konservatyvus numatytas
// dydis — 50 laiškų nusiunčiami per ~25 sek, toli nuo bet kokio realaus
// SMTP provider'io limito, bet NEDIDINA abuse/spam rizikos.
const transporter = nodemailer.createTransport({
  host: env.email.host,
  port: env.email.port,
  secure: env.email.secure,
  auth: env.email.user ? { user: env.email.user, pass: env.email.pass } : undefined,
  pool: true,
  maxConnections: 2,
  rateDelta: 1000,
  rateLimit: 2,
});

export interface RemainingPaymentEmailInput {
  to: string;
  orderNumber: string;
  amount: number;
  payUrl: string;
}

export async function sendRemainingPaymentEmail(input: RemainingPaymentEmailInput): Promise<void> {
  const amountText = input.amount.toFixed(2);
  await transporter.sendMail({
    from: env.email.from,
    to: input.to,
    subject: `Liko sumokėti už užsakymą ${input.orderNumber}`,
    text: `Jūsų užsakymo ${input.orderNumber} likusi mokėtina suma: ${amountText} €.\n\nApmokėti: ${input.payUrl}`,
    html: `<p>Jūsų užsakymo <strong>${input.orderNumber}</strong> likusi mokėtina suma: <strong>${amountText} €</strong>.</p><p><a href="${input.payUrl}">Apmokėti likusią sumą</a></p>`,
  });
}

export interface PaymentConfirmationEmailInput {
  to: string;
  subject: string;
  introText: string;
  // subItems (pvz. kelių kajučių tipų suvestinė CRUISE užsakymams) rodomas
  // kaip įdėtinis <ul> po šio <li> antrašte, o ne viena kableliais atskirta
  // eilutė — value tada ignoruojamas.
  items: { label: string; value: string; subItems?: string[] }[];
  outroParagraphs?: string[];
}

// Bendra HTML/text struktūra visiems trims patvirtinimo laiškams (FULL/DEPOSIT/
// REMAINING, žr. documents.service.ts) — jie skiriasi tik subject/introText/
// items/outroParagraphs reikšmėmis.
export async function sendPaymentConfirmationEmail(input: PaymentConfirmationEmailInput): Promise<void> {
  const itemsText = input.items
    .map((i) =>
      i.subItems && i.subItems.length > 0
        ? `${i.label}:\n${i.subItems.map((s) => `  - ${s}`).join("\n")}`
        : `${i.label}: ${i.value}`,
    )
    .join("\n");
  const itemsHtml = input.items
    .map((i) =>
      i.subItems && i.subItems.length > 0
        ? `<li>${i.label}:<ul>${i.subItems.map((s) => `<li>${s}</li>`).join("")}</ul></li>`
        : `<li>${i.label}: <strong>${i.value}</strong></li>`,
    )
    .join("");
  const outroText = (input.outroParagraphs ?? []).join("\n\n");
  const outroHtml = (input.outroParagraphs ?? []).map((p) => `<p>${p}</p>`).join("");
  const signature = 'Pagarbiai,\nVšĮ „Prasmingam gyvenimui“ komanda';

  await transporter.sendMail({
    from: env.email.from,
    to: input.to,
    subject: input.subject,
    text: `Sveiki!\n\n${input.introText}\n\n${itemsText}${outroText ? `\n\n${outroText}` : ""}\n\n${signature}`,
    html: `<h2>Sveiki!</h2><p>${input.introText}</p><ul>${itemsHtml}</ul>${outroHtml}<p>Pagarbiai,<br/>VšĮ „Prasmingam gyvenimui“ komanda</p>`,
  });
}
