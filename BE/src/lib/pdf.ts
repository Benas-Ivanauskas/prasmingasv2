import puppeteer, { type Browser } from "puppeteer";
import { logger } from "./logger.js";

let browserPromise: Promise<Browser> | null = null;

// Vienas naršyklės procesas per visą server'io gyvavimą, pakartotinai
// naudojamas kiekvienam PDF generavimui (naujas TIK puslapis per kvietimą,
// ne nauja naršyklė — paleidimas užtrunka ~1-2s, nenorime to kartoti kas
// request'ą). SVARBU: Chromium renderina ATSKIRAME OS procese, tad Node'o
// event loop NIEKADA neblokuojamas, nepriklausomai nuo PDF sudėtingumo —
// `await` tiesiog laukia proceso atsakymo per IPC, lygiai kaip ir bet kokia
// kita I/O operacija (DB užklausa, HTTP kvietimas).
function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({
        headless: true,
        // --no-sandbox: standartinė praktika serverinei Puppeteer aplinkai
        // (VPS/konteineriuose dažnai trūksta Chromium sandbox'ui reikalingų
        // kernel namespace'ų). Priimtina, nes renderiname TIK savo pačių
        // admin'o parašytą turinį, ne atsitiktinį iš interneto.
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      })
      .catch((err) => {
        browserPromise = null; // leidžia kitam kvietimui bandyti iš naujo
        throw err;
      });
  }
  return browserPromise;
}

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close().catch((err) => logger.error({ err }, "Nepavyko uždaryti Puppeteer puslapio"));
  }
}
