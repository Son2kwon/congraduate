/**
 * 본인 포털 파일(docs/private, 로컬 전용) → 파서 → 엔진 입력. 통합 검증 테스트와 보고 스크립트가 함께 쓴다.
 * Node 전용 (fs). 앱(브라우저)에서는 쓰지 않는다.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createCourseIndex } from "../engine/courses";
import { evaluate, type EvaluateOutput } from "../engine/evaluate";
import { ExpectedFile, LiberalCatalog, MajorCatalog, RuleFile, type SchoolStandardOverride } from "../engine/schema";
import type { CourseRecord, StudentInfo } from "../engine/types";
import { abeekStatusItemsToText, parseAbeekStatusText } from "../parsers/abeek-status";
import { parseGradDetailText } from "../parsers/grad-detail";
import { parseGradSummaryXlsx } from "../parsers/grad-summary";
import { mergePortalRecords, type MergeResult } from "../parsers/merge";
import { extractPdfItems, extractPdfText } from "../parsers/pdf-text";

export const ROOT = join(import.meta.dirname, "../..");

export function privateFiles(dir = process.env.CONGRADUATE_PRIVATE_DIR ?? join(ROOT, "docs/private")) {
  const files = {
    abeek: join(dir, "공학인증_이수현황.pdf"),
    grad: join(dir, "졸업관련성적내역.pdf"),
    xlsx: join(dir, "졸업관련성적조회_이수내역.xlsx"),
  };
  return { files, available: Object.values(files).every(existsSync) };
}

const PDF = {
  cMapUrl: join(ROOT, "node_modules/pdfjs-dist/cmaps/"),
  standardFontDataUrl: join(ROOT, "node_modules/pdfjs-dist/standard_fonts/"),
  workerSrc: pathToFileURL(join(ROOT, "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs")).href,
};
const read = (p: string) => new Uint8Array(readFileSync(p));
const readJson = (rel: string): unknown => JSON.parse(readFileSync(join(ROOT, rel), "utf8"));

export const loadRules = () => RuleFile.parse(readJson("data/rules/cau_sw_2022.rules.json"));
export const loadExpected = () => ExpectedFile.parse(readJson("data/rules/cau_sw_2022.expected.json"));
export const loadCourseIndex = () =>
  createCourseIndex(
    MajorCatalog.parse(readJson("data/catalog/courses_cau_sw.json")),
    LiberalCatalog.parse(readJson("data/catalog/liberal_arts_2026_1.json")),
  );

export type PrivatePortal = { merged: MergeResult; records: CourseRecord[]; standard: SchoolStandardOverride; unparsed: number };

export async function loadPrivatePortal(files: ReturnType<typeof privateFiles>["files"]): Promise<PrivatePortal> {
  const abeek = parseAbeekStatusText(abeekStatusItemsToText(await extractPdfItems(read(files.abeek), PDF)));
  const grad = parseGradDetailText(await extractPdfText(read(files.grad), PDF));
  const merged = mergePortalRecords(abeek.rows, grad.rows);
  const standard = await parseGradSummaryXlsx(read(files.xlsx));
  return { merged, records: merged.records, standard, unparsed: abeek.unparsed.length + grad.unparsed.length };
}

/** 본인 학생 정보 — 정답 숫자는 이수 기록만으로 정해지므로 직접 입력 항목은 비워 둔다 */
export const FIXTURE_STUDENT: StudentInfo = {
  entry_year: 2022,
  expected_graduation: { year: 2026, season: "2" },
  manual: {
    language_tests: [],
    topcit: [],
    thesis_passed: false,
    counts: {},
    checked: {},
    design: { internship_design_credits: 0, capstone_by_internship: null },
  },
};

export function evaluatePrivate(p: PrivatePortal): EvaluateOutput {
  return evaluate({ rules: loadRules(), courses: loadCourseIndex(), records: p.records, student: FIXTURE_STUDENT, standard: p.standard });
}
