import {
  extractPdfItems, extractPdfText, abeekStatusItemsToText, parseAbeekStatusText, parseGradDetailText,
  parseGradSummaryXlsx, mergePortalRecords, type AbeekStatusRow, type GradDetailRow, type PdfTextOptions,
} from "../../parsers";
import type { SchoolStandardOverride } from "../../engine/schema/standard";

export type PortalKind = "abeek" | "grad";
export type AbeekDocument = { kind: "abeek"; rows: AbeekStatusRow[]; unparsedCount: number };
export type GradDocument = { kind: "grad"; rows: GradDetailRow[]; unparsedCount: number };
export type SummaryDocument = { kind: "summary"; standard: SchoolStandardOverride };
export type ParsedDocument = AbeekDocument | GradDocument | SummaryDocument;

export function pdfOptions(baseUrl: string): PdfTextOptions {
  return { cMapUrl: new URL("pdfjs/cmaps/", baseUrl).href, standardFontDataUrl: new URL("pdfjs/standard_fonts/", baseUrl).href, workerSrc: new URL("pdfjs/pdf.worker.mjs", baseUrl).href };
}
export function parsePortalText(kind: "abeek", text: string): AbeekDocument;
export function parsePortalText(kind: "grad", text: string): GradDocument;
export function parsePortalText(kind: PortalKind, text: string): AbeekDocument | GradDocument;
export function parsePortalText(kind: PortalKind, text: string): AbeekDocument | GradDocument {
  if (kind === "abeek") {
    const parsed = parseAbeekStatusText(text);
    if (!parsed.rows.length) throw new Error("과목을 읽지 못했습니다. 문서 종류와 탭으로 구분된 내용을 확인해 주세요.");
    return { kind, rows: parsed.rows, unparsedCount: parsed.unparsed.length };
  }
  const parsed = parseGradDetailText(text);
  if (!parsed.rows.length) throw new Error("과목을 읽지 못했습니다. 문서 종류와 탭으로 구분된 내용을 확인해 주세요.");
  return { kind, rows: parsed.rows, unparsedCount: parsed.unparsed.length };
}
export async function parsePortalFile(kind: PortalKind | "summary", bytes: Uint8Array, baseUrl: string): Promise<ParsedDocument> {
  if (kind === "summary") {
    const standard = await parseGradSummaryXlsx(bytes);
    if (!standard.rows.length) throw new Error("학교 기준 행을 읽지 못했습니다.");
    return { kind, standard };
  }
  const options = pdfOptions(baseUrl);
  return kind === "abeek"
    ? parsePortalText("abeek", abeekStatusItemsToText(await extractPdfItems(bytes, options)))
    : parsePortalText("grad", await extractPdfText(bytes, options));
}
export const combineDocuments = (abeek: AbeekDocument | null, grad: GradDocument | null) => mergePortalRecords(abeek?.rows ?? [], grad?.rows ?? []);
