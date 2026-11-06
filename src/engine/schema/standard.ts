import { z } from "zod";
import type { CreditRequirement } from "./requirement";

/**
 * 학교 기준 대체 (decisions.md 14번).
 *
 * - 학생이 이수내역 xlsx를 올리면 파서(3단계)가 '졸업영역구분' 행 이름과 '이수기준' 값을 읽어 이 형식으로 넘긴다.
 *   행 순서가 아니라 행 이름으로 읽는다.
 * - 엔진(2단계 resolveGeneral)은 규칙의 portal_rows가 일치하는 요구사항의 기준값만 바꾼다.
 * - 규칙에 없는 행 이름은 버리지 않고 unknown_rows로 남겨 "알 수 없는 기준"으로 표시한다.
 * - xlsx가 없으면 basis = "default_<학번>"(예: "default_2022")이고 화면에 "학번에 따라 다를 수 있음 — xlsx를 올리면 정확해짐"을 표시한다.
 */
export const SchoolStandardRow = z.strictObject({
  /** 졸업영역구분 (예: "전공기초", "핵심-도전") */
  name: z.string().min(1),
  /** 이수기준. 빈칸이면 null */
  criterion: z.number().nonnegative().nullable(),
});
export type SchoolStandardRow = z.infer<typeof SchoolStandardRow>;

export const SchoolStandardOverride = z.strictObject({
  source: z.literal("grad_summary_xlsx"),
  rows: z.array(SchoolStandardRow),
});
export type SchoolStandardOverride = z.infer<typeof SchoolStandardOverride>;

/** 학교 기준을 확정한 결과 (엔진 resolveGeneral의 출력, 2단계에서 구현) */
export type ResolvedGeneral = {
  /** "xlsx": 학생 xlsx 기준 / "default_2022": 규칙 파일 기본값 (default_entry_year 학번) */
  basis: "xlsx" | `default_${number}`;
  default_entry_year: number;
  requirements: CreditRequirement[];
  /** 요구사항 id → 대체된 기준값 출처 행 */
  overridden: Record<string, SchoolStandardRow[]>;
  /** 규칙의 portal_rows 어디에도 없는 xlsx 행 */
  unknown_rows: SchoolStandardRow[];
};
