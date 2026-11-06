import type { SchoolStandardOverride, SchoolStandardRow } from "../engine/schema";

/** 형식 고유의 행 이름 → 규칙 portal_rows 이름 */
const ROW_ALIASES: Record<string, string> = {
  "교양(교양 최대 이수가능학점)": "교양",
  "졸업가능학점(취득학점)": "졸업",
};
/** 한 행에 두 기준이 "84(12)"처럼 들어 있는 행 → [바깥 값 이름, 괄호 값 이름] */
const COMPOUND_ROWS: Record<string, [string, string]> = {
  "전공(전공필수)": ["전공", "전공필수"],
};

const norm = (s: unknown) => String(s ?? "").replace(/\s+/g, "");
const PLAIN = /^\d+(?:\.\d+)?$/;
const PAIR = /^(\d+(?:\.\d+)?)\((\d+(?:\.\d+)?)\)$/;

/**
 * 이수내역 시트 행(2차원 배열) → 학교 기준 (decisions.md 14번).
 * 행 순서가 아니라 행 이름(졸업영역구분)으로 읽는다. 열도 머리글 이름으로 찾는다.
 * 모르는 행도 버리지 않는다 — 숫자가 아니면 criterion null, 원래 값은 raw.
 */
export function parseGradSummaryRows(rows: unknown[][]): SchoolStandardOverride {
  const h = rows.findIndex((r) => r.some((c) => norm(c) === "졸업영역구분"));
  if (h < 0) throw new Error("이수내역 머리글(졸업영역구분)을 찾을 수 없습니다");
  const header = rows[h]!.map(norm);
  const nameCol = header.indexOf("졸업영역구분");
  const critCol = header.indexOf("이수기준");
  if (critCol < 0) throw new Error("이수내역 머리글(이수기준)을 찾을 수 없습니다");

  const out: SchoolStandardRow[] = [];
  for (const r of rows.slice(h + 1)) {
    const name = String(r[nameCol] ?? "").trim();
    if (!name) continue;
    const raw = String(r[critCol] ?? "").trim();
    const compound = COMPOUND_ROWS[name];
    const pair = PAIR.exec(raw);
    if (compound && pair) {
      out.push({ name: compound[0], criterion: Number(pair[1]), raw }, { name: compound[1], criterion: Number(pair[2]), raw });
      continue;
    }
    out.push({ name: ROW_ALIASES[name] ?? name, criterion: PLAIN.test(raw) ? Number(raw) : null, raw });
  }
  return { source: "grad_summary_xlsx", rows: out };
}

/** xlsx 파일 바이트 → 학교 기준 (첫 시트) */
export async function parseGradSummaryXlsx(data: Uint8Array): Promise<SchoolStandardOverride> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(data, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]!]!;
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "" });
  return parseGradSummaryRows(rows);
}
