import { z } from "zod";

/**
 * 과목 카탈로그 (data/catalog/). 아직 안 들은 과목(수강 계획)의 분류에 쓴다 (decisions.md 8번).
 * 들은 과목은 포털 문서의 값을 쓴다.
 */
const Text = z.string().min(1);
const Code = z.string().regex(/^\d{5}$/, "과목코드는 숫자 5자리");

// ---------- 전공 카탈로그 courses_cau_sw.json ----------

const PrereqAny = z.array(z.array(Text).nonempty()).nonempty();

export const MajorCourse = z.strictObject({
  /** 공백 제거 과목명. 과목 참조(CourseRef)의 기준 */
  key: Text,
  name: Text,
  aliases: z.array(Text),
  /** 교과과정표의 이수구분. track_only 과목은 미상(null) */
  category: z.enum(["전공기초", "전공필수", "전공"]).nullable(),
  credits: z.number().positive().nullable(),
  hours: z.number().positive().optional(),
  year: z.number().int().min(1).max(4),
  semester: z.union([z.literal(1), z.literal(2)]),
  tracks: z.array(Text),
  source: z.enum(["main_table", "track_only"]),
  /** 선수과목: 바깥 배열은 AND, 안쪽 배열은 OR */
  prerequisites_any: PrereqAny.nullable().optional(),
  prerequisites_source: Text.optional(),
  prerequisites_history: z
    .array(z.strictObject({ as_of: Text, prerequisites_any: PrereqAny.nullable() }))
    .nullable()
    .optional(),
  general: z.strictObject({
    category: z.enum(["전공기초", "전공필수", "전공"]).nullable(),
    history: z.array(z.strictObject({ as_of: Text, category: Text, source: Text })),
    current_as_of: Text,
  }),
  abeek: z.strictObject({
    category: z.enum(["전문교양", "BSM", "공학주제", "기타"]).nullable(),
    required: z.boolean(),
    chart_marked_required: z.boolean(),
    /** "required": 설계필수 과목 */
    design: z.union([z.literal("required"), z.boolean()]),
    design_credits: z.number().int().nonnegative(),
    design_credits_history: z.array(
      z.strictObject({ as_of: Text, design_credits: z.number().int().nonnegative(), name: Text.optional() }),
    ),
    design_credits_source: Text,
    /** 수강 당시 조건에 따라 설계학점이 달라지는 경우의 설명 (2단계에서 구조화 여부 결정) */
    design_credits_rule: Text.optional(),
  }),
});
export type MajorCourse = z.infer<typeof MajorCourse>;

export const MajorCatalog = z.strictObject({
  source: Text,
  fetched: Text,
  curriculum_year: z.number().int().nullable(),
  note: Text,
  courses: z.array(MajorCourse).nonempty(),
  dual_listing: z.array(Text),
  notes: z.array(Text),
  abeek_bsm_lab: z.array(Text),
  abeek_professional_liberal: z.array(z.strictObject({ name: Text, credits: z.number().positive() })),
  classification_sources: z.record(z.string(), z.string()),
});
export type MajorCatalog = z.infer<typeof MajorCatalog>;

// ---------- 교양 카탈로그 liberal_arts_2026_1.json ----------

export const LIBERAL_AREAS = [
  "핵심-도전",
  "핵심-창의",
  "핵심-융합",
  "핵심-신뢰",
  "핵심-소통",
  "선택-도전",
  "선택-창의",
  "선택-융합",
  "선택-신뢰",
  "선택-소통",
] as const;

export const CommonLiberalCourse = z.strictObject({
  code: Code,
  name: Text,
  credits: z.number().positive(),
  /** 학번 구간 → 원문 분류 표기 (PDF 추출 원문 그대로) */
  by_entry_year: z.record(z.string(), z.string().nullable()),
  aliases: z.array(Text),
});

export const LiberalCourse = z.strictObject({
  code: Code,
  name: Text,
  credits: z.number().positive(),
  area: z.enum(LIBERAL_AREAS),
  /** 서울캠퍼스 [1학기, 2학기] 개설 여부 */
  seoul: z.tuple([z.boolean(), z.boolean()]),
});

export const OtherCourse = z.strictObject({
  code: Code,
  name: Text,
  credits: z.number().positive(),
  general_category: Text,
  note: Text.optional(),
});

export const LiberalCatalog = z
  .strictObject({
    source: Text,
    common: z.array(CommonLiberalCourse).nonempty(),
    courses: z.array(LiberalCourse).nonempty(),
    other: z.array(OtherCourse),
  })
  .superRefine((c, ctx) => {
    const codes = [...c.common, ...c.courses, ...c.other].map((x) => x.code);
    const dup = codes.filter((x, i) => codes.indexOf(x) !== i);
    if (dup.length) ctx.addIssue({ code: "custom", message: `과목코드 중복: ${[...new Set(dup)].join(", ")}` });
  });
export type LiberalCatalog = z.infer<typeof LiberalCatalog>;
