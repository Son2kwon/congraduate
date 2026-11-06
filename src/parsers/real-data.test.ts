/**
 * 본인 포털 파일로 하는 파서 검증 (sprint.md 3단계 완료 기준).
 * - docs/private/ 파일이 없으면 전체 skip — 다른 환경에서도 테스트가 통과한다
 * - 실패 메시지에 과목·성적이 찍히지 않도록 개수·합계·규칙 id만 비교한다
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { resolveGeneral } from "../engine/evaluate";
import { ExpectedFile, RuleFile, type CreditRequirement } from "../engine/schema";
import { abeekStatusItemsToText, parseAbeekStatusText } from "./abeek-status";
import { parseGradDetailText } from "./grad-detail";
import { parseGradSummaryXlsx } from "./grad-summary";
import { mergePortalRecords, type MergeResult } from "./merge";
import { extractPdfItems, extractPdfText } from "./pdf-text";

const ROOT = join(__dirname, "../..");
/** 개인 자료 위치. 테스트용으로 CONGRADUATE_PRIVATE_DIR로 바꿀 수 있다 */
const PRIVATE = process.env.CONGRADUATE_PRIVATE_DIR ?? join(ROOT, "docs/private");
const FILES = {
  abeek: join(PRIVATE, "공학인증_이수현황.pdf"),
  grad: join(PRIVATE, "졸업관련성적내역.pdf"),
  xlsx: join(PRIVATE, "졸업관련성적조회_이수내역.xlsx"),
};
const available = Object.values(FILES).every(existsSync);

const PDF = {
  cMapUrl: join(ROOT, "node_modules/pdfjs-dist/cmaps/"),
  standardFontDataUrl: join(ROOT, "node_modules/pdfjs-dist/standard_fonts/"),
  workerSrc: pathToFileURL(join(ROOT, "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs")).href,
};
const read = (p: string) => new Uint8Array(readFileSync(p));
const readJson = (rel: string): unknown => JSON.parse(readFileSync(join(ROOT, rel), "utf8"));

/** 본인 이수 과목 수 (decisions.md 4번: 41과목) */
const EXPECTED_COURSES = 41;

describe.skipIf(!available)("본인 포털 파일 (docs/private, 로컬 전용)", () => {
  const expected = ExpectedFile.parse(readJson("data/rules/cau_sw_2022.expected.json"));
  const rules = RuleFile.parse(readJson("data/rules/cau_sw_2022.rules.json"));
  let abeek: ReturnType<typeof parseAbeekStatusText>;
  let grad: ReturnType<typeof parseGradDetailText>;
  let merged: MergeResult;

  beforeAll(async () => {
    abeek = parseAbeekStatusText(abeekStatusItemsToText(await extractPdfItems(read(FILES.abeek), PDF)));
    grad = parseGradDetailText(await extractPdfText(read(FILES.grad), PDF));
    merged = mergePortalRecords(abeek.rows, grad.rows);
  }, 60_000);

  describe("두 PDF", () => {
    it("이수현황: 41과목, 형식이 어긋난 과목 줄 0", () => {
      expect(abeek.rows.length).toBe(EXPECTED_COURSES);
      expect(abeek.unparsed.length).toBe(0);
    });

    it("성적내역: 41과목, 형식이 어긋난 과목 줄 0", () => {
      expect(grad.rows.length).toBe(EXPECTED_COURSES);
      expect(grad.unparsed.length).toBe(0);
    });

    it("합치기: 41과목, 한쪽 문서에만 있는 과목 0, 불일치 경고 0", () => {
      expect(merged.records.length).toBe(EXPECTED_COURSES);
      expect(merged.only_abeek_status.length).toBe(0);
      expect(merged.only_grad_detail.length).toBe(0);
      expect(merged.warnings.length).toBe(0);
    });

    it("합친 모든 과목에 일반 이수구분과 공학인증 구분이 있다", () => {
      expect(merged.records.filter((r) => !r.general_category || !r.abeek_category).length).toBe(0);
    });

    it("학점 합계 = 포털 전체 취득학점, 설계학점 합계 = 이수현황 총계의 설계학점", () => {
      const credits = merged.records.reduce((s, r) => s + r.credits, 0);
      const design = merged.records.reduce((s, r) => s + r.design_credits, 0);
      expect(credits).toBe(expected.abeek["전체"]);
      expect(design).toBe((expected.abeek["설계"] as [number, number])[0]);
    });
  });

  describe("이수내역 xlsx", () => {
    it("xlsx 기준이 2022 기본 규칙 값과 같게 읽힌다", async () => {
      const override = await parseGradSummaryXlsx(read(FILES.xlsx));
      const g = resolveGeneral(rules.rule_sets.general, override);
      const value = (r: CreditRequirement) => {
        switch (r.type) {
          case "credits_min":
            return r.min;
          case "credits_max":
            return r.max;
          case "courses_all":
            return r.min_credits;
          case "groups_each_min_credits":
            return r.groups.map((x) => r.min_by_group?.[x] ?? r.min_each);
          default:
            return null;
        }
      };
      const defaults = rules.rule_sets.general.requirements;
      const differs = g.requirements.filter((r, i) => JSON.stringify(value(r)) !== JSON.stringify(value(defaults[i]!))).map((r) => r.id);
      expect(differs).toEqual([]);
      // portal_rows가 있는 요구사항은 모두 xlsx 값으로 확인됨
      const withRows = defaults.filter((r) => "portal_rows" in r && r.portal_rows).map((r) => r.id).sort();
      expect(Object.keys(g.overridden).sort()).toEqual(withRows);
    });

    it("MVP에서 무시하는 행은 알 수 없는 기준으로 남는다", async () => {
      const g = resolveGeneral(rules.rule_sets.general, await parseGradSummaryXlsx(read(FILES.xlsx)));
      expect(g.unknown_rows.map((r) => r.name).sort()).toEqual(["군사학", "복수전공", "전공심화(전공필수)"].sort());
    });
  });
});
