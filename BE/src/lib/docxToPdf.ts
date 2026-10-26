import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { env } from "../config/env.js";

const execFileAsync = promisify(execFile);

// soffice --headless spawn'ina ATSKIRĄ OS procesą (tas pats principas kaip
// Puppeteer lib/pdf.ts'e) — Node tik await'ina užbaigimą per execFile,
// niekada *Sync variantų, event loop'as neblokuojamas.
//
// -env:UserInstallation=<unikalus katalogas> izoliuoja kiekvieną kvietimą
// nuo LibreOffice profilio spynos — be šito du vienu metu paleisti
// konvertavimai gali susikirsti ("galima tik viena soffice instancija").
export async function convertDocxToPdf(docxBuffer: Buffer): Promise<Buffer> {
  const workDir = await mkdtemp(path.join(tmpdir(), "docx2pdf-"));
  const profileDir = path.join(workDir, "profile");
  const docxPath = path.join(workDir, "input.docx");
  try {
    await writeFile(docxPath, docxBuffer);
    // file:// URL reikalauja "/" skyriklių ir trigubo kirpio absoliučiam
    // keliui — Windows naudoja "\", todėl konvertuojama rankiniu būdu
    // (naudojant pvz. url.pathToFileURL, LibreOffice'as dažnai nepriima
    // tikslaus Node formato su "C:/" prefiksu).
    const profileUrl = `file:///${profileDir.replace(/\\/g, "/")}`;
    await execFileAsync(
      env.libreofficePath,
      [
        "--headless",
        "--norestore",
        `-env:UserInstallation=${profileUrl}`,
        "--convert-to",
        "pdf",
        "--outdir",
        workDir,
        docxPath,
      ],
      { timeout: 30_000 },
    );
    return await readFile(path.join(workDir, "input.pdf"));
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
