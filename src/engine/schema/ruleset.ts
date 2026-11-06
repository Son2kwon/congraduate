import { z } from "zod";
import { CreditRequirement, NonCreditRequirement } from "./requirement";

/**
 * 판정 규칙 파일 (data/rules/<id>.rules.json). 엔진이 읽는 값만 담는다.
 * 출처·메모·이력은 근거 기록 파일(evidence.ts)에 있다.
 *
 * 학번 처리 (decisions.md 14번)
 * - abeek(공학인증): supported_entry_years 전 학번 공통. 학번별 차이는 요구사항의 cohort_rules로 표현
 * - general(학교 기준): basis.default_entry_year의 기본값. 이수내역 xlsx가 있으면
 *   그 '이수기준'으로 portal_rows가 일치하는 요구사항의 기준값을 대체 (standard.ts)
 */
export const RuleFile = z
  .strictObject({
    $schema_note: z.string().optional(),
    meta: z.strictObject({
      school: z.string().min(1),
      campus: z.string().min(1),
      department: z.string().min(1),
      version: z.string().min(1),
      created: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      supported_entry_years: z.strictObject({ from: z.number().int(), to: z.number().int() }),
    }),
    classification: z.strictObject({
      general_categories: z.array(z.string().min(1)).nonempty(),
      abeek_categories: z.array(z.string().min(1)).nonempty(),
      /** 묶음 이름 → 일반 이수구분 목록 (예: 교양 = 공통교양 + 핵심교양 + 선택교양) */
      category_groups: z.record(z.string(), z.array(z.string().min(1)).nonempty()),
    }),
    counting: z.strictObject({
      /** 재수강 시 마지막 수강 기록만 인정 */
      retake: z.literal("last_only"),
    }),
    rule_sets: z.strictObject({
      general: z.strictObject({
        label: z.string().min(1),
        basis: z.strictObject({
          default_entry_year: z.number().int(),
          override: z.literal("grad_summary_xlsx"),
        }),
        requirements: z.array(CreditRequirement).nonempty(),
      }),
      abeek: z.strictObject({
        label: z.string().min(1),
        applies_when: z.strictObject({
          entry_year_gte: z.number().int(),
          program: z.literal("abeek"),
        }),
        requirements: z.array(CreditRequirement).nonempty(),
      }),
    }),
    non_credit: z.array(NonCreditRequirement),
  })
  .superRefine((f, ctx) => {
    const { from, to } = f.meta.supported_entry_years;
    if (from > to) ctx.addIssue({ code: "custom", message: "supported_entry_years.from > to" });

    // portal_rows는 학교 기준(general)에만 쓴다
    f.rule_sets.abeek.requirements.forEach((r, i) => {
      if ("portal_rows" in r && r.portal_rows)
        ctx.addIssue({ code: "custom", path: ["rule_sets", "abeek", "requirements", i], message: "abeek 요구사항에는 portal_rows를 쓰지 않음" });
    });

    // id 중복 금지 (일반·공학인증·비학점 전체)
    const ids = [
      ...f.rule_sets.general.requirements,
      ...f.rule_sets.abeek.requirements,
      ...f.non_credit,
    ].map((r) => r.id);
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dup.length) ctx.addIssue({ code: "custom", message: `요구사항 id 중복: ${dup.join(", ")}` });

    // category_groups 구성원은 일반 이수구분이어야 함
    for (const [g, members] of Object.entries(f.classification.category_groups)) {
      for (const m of members)
        if (!f.classification.general_categories.includes(m))
          ctx.addIssue({ code: "custom", path: ["classification", "category_groups", g], message: `알 수 없는 이수구분 ${m}` });
    }
  });
export type RuleFile = z.infer<typeof RuleFile>;

/** 규칙 파일을 검증해 읽는다. 형식이 맞지 않으면 예외. */
export function parseRuleFile(json: unknown): RuleFile {
  return RuleFile.parse(json);
}
