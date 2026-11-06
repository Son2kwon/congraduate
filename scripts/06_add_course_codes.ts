/**
 * 06 — 포털 문서에서 읽은 과목코드를 전공 카탈로그(courses_cau_sw.json)에 추가한다.
 *
 * 실행: npx tsx scripts/06_add_course_codes.ts [개인 자료 폴더, 기본 docs/private]
 * (01~05 다음에 실행. 05를 다시 돌린 뒤에도 이 스크립트를 다시 돌릴 것)
 *
 * - 입력: 공학교육인증 이수현황 PDF + 졸업관련성적내역 PDF (로컬 전용, 커밋 금지)
 * - 카탈로그에는 과목코드만 넣는다. 성적·학기·분반은 넣지 않는다
 * - 성적내역 이수구분이 전공기초·전공필수·전공인 과목만 쓴다
 *   (같은 이름 다른 코드 방지: 예 자료구조 56116은 자유선택이라 제외)
 * - 출력에는 개수와 카탈로그에 없는 과목명만 찍는다
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createCourseIndex, normalizeName } from "../src/engine/courses";
import { LiberalCatalog, MajorCatalog } from "../src/engine/schema";
import { abeekStatusItemsToText, parseAbeekStatusText } from "../src/parsers/abeek-status";
import { parseGradDetailText } from "../src/parsers/grad-detail";
import { mergePortalRecords } from "../src/parsers/merge";
import { extractPdfItems, extractPdfText } from "../src/parsers/pdf-text";

const ROOT = resolve(import.meta.dirname, "..");
const PRIVATE = resolve(process.argv[2] ?? join(ROOT, "docs/private"));
const CATALOG = join(ROOT, "data/catalog/courses_cau_sw.json");
const MAJOR_CATEGORIES = new Set(["전공기초", "전공필수", "전공"]);

const PDF = {
  cMapUrl: join(ROOT, "node_modules/pdfjs-dist/cmaps/"),
  standardFontDataUrl: join(ROOT, "node_modules/pdfjs-dist/standard_fonts/"),
  workerSrc: pathToFileURL(join(ROOT, "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs")).href,
};
const read = (p: string) => new Uint8Array(readFileSync(p));

async function main() {
  const abeek = parseAbeekStatusText(abeekStatusItemsToText(await extractPdfItems(read(join(PRIVATE, "공학인증_이수현황.pdf")), PDF)));
  const grad = parseGradDetailText(await extractPdfText(read(join(PRIVATE, "졸업관련성적내역.pdf")), PDF));
  const { records, only_abeek_status, only_grad_detail } = mergePortalRecords(abeek.rows, grad.rows);
  if (only_abeek_status.length || only_grad_detail.length || abeek.unparsed.length || grad.unparsed.length) {
    throw new Error("두 PDF가 완전히 합쳐지지 않음 — 파서 테스트(real-data.test.ts)부터 확인");
  }

  const raw = JSON.parse(readFileSync(CATALOG, "utf8")) as Record<string, unknown> & { courses: Record<string, unknown>[] };
  const major = MajorCatalog.parse(raw);
  const liberal = LiberalCatalog.parse(JSON.parse(readFileSync(join(ROOT, "data/catalog/liberal_arts_2026_1.json"), "utf8")));
  const index = createCourseIndex(major, liberal);
  const byKey = new Map(major.courses.map((c) => [normalizeName(c.key), c.key]));

  const found = new Map<string, Set<string>>(); // 카탈로그 key → 코드
  const notInCatalog = new Set<string>();
  for (const r of records) {
    if (!r.code || !r.general_category || !MAJOR_CATEGORIES.has(r.general_category)) continue;
    const key = byKey.get(index.canonical(r.name));
    if (!key) {
      notInCatalog.add(r.name);
      continue;
    }
    (found.get(key) ?? found.set(key, new Set()).get(key)!).add(r.code);
  }

  // 코드가 두 과목에 걸치면 중단
  const owner = new Map<string, string>();
  for (const c of major.courses) for (const code of c.codes ?? []) owner.set(code, c.key);
  for (const [key, codes] of found) {
    for (const code of codes) {
      const prev = owner.get(code);
      if (prev && prev !== key) throw new Error(`과목코드 ${code}가 ${prev}와 ${key}에 동시에 해당`);
      owner.set(code, key);
    }
  }

  let added = 0;
  raw.courses = raw.courses.map((c) => {
    const codes = found.get(c.key as string);
    if (!codes) return c;
    const merged = [...new Set([...((c.codes as string[] | undefined) ?? []), ...codes])].sort();
    added += merged.length - ((c.codes as string[] | undefined)?.length ?? 0);
    // codes는 aliases 바로 뒤에 둔다
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(c)) {
      if (k === "codes") continue;
      out[k] = v;
      if (k === "aliases") out.codes = merged;
    }
    return out;
  });
  MajorCatalog.parse(raw);
  writeFileSync(CATALOG, JSON.stringify(raw, null, 2) + "\n", "utf8");

  console.log(`전공 이수구분 과목 → 카탈로그 과목 ${found.size}개에 코드 반영 (새 코드 ${added}개)`);
  console.log(`카탈로그에 없는 전공 과목명 ${notInCatalog.size}개${notInCatalog.size ? `: ${[...notInCatalog].join(", ")}` : ""}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
