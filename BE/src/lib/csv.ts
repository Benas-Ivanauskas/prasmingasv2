// RFC4180 stiliaus — kabutėmis apgaubiama TIK kai reikia (yra kablelis/
// kabutė/eilutės lūžis), vidinės kabutės dvigubinamos.
export function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function csvRow(values: string[]): string {
  return values.map(csvCell).join(",");
}

// ﻿ — UTF-8 BOM, kad Excel (ne tik LibreOffice/Notepad) teisingai
// atpažintų lietuviškas raides atidarant failą tiesiogiai, ne per "Import"
// dialogą su rankiniu encoding'o pasirinkimu.
export function toCsvDocument(rows: string[]): string {
  return "﻿" + rows.join("\r\n") + "\r\n";
}
