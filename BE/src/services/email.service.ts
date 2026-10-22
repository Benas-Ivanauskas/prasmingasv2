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
