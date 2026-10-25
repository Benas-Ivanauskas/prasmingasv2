import nodemailer from "nodemailer";
import { env } from "../config/env.js";

// Reali integracija — tas pats principas kaip Paysera: serveris paleidžiasi
// be tikrų SMTP kredencialų, bet sendMail() tada tiesiog mes klaidą
// natūraliai (kvietėjas ją traktuoja nefataliai, žr. adminOrder.service.ts).
const transporter = nodemailer.createTransport({
  host: env.email.host,
  port: env.email.port,
  secure: env.email.secure,
  auth: env.email.user ? { user: env.email.user, pass: env.email.pass } : undefined,
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
