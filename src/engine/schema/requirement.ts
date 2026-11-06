import { z } from "zod";
import { CourseRef, Match } from "./match";

/**
 * 요구사항 유형 9가지 (decisions.md 7번).
 *
 * | type                    | 뜻             |
 * |-------------------------|----------------|
 * | credits_min             | 최소학점       |
 * | credits_max             | 최대학점       |
 * | courses_all             | 과목 전부 이수 |
 * | groups_each_min_credits | 영역별 최소    |
 * | design_credits_min      | 설계학점       |
 * | any_of                  | 택1            |
 * | choose_n                | n개 중 선택    |
 * | checklist               | 체크리스트     |
 * | count_min               | 횟수           |
 */
export const REQUIREMENT_TYPES = [
  "credits_min",
  "credits_max",
  "courses_all",
  "groups_each_min_credits",
  "design_credits_min",
  "any_of",
  "choose_n",
  "checklist",
  "count_min",
] as const;
export type RequirementType = (typeof REQUIREMENT_TYPES)[number];

const Id = z.string().regex(/^[a-z][a-z0-9_]*$/, "id는 영소문자·숫자·_");
const Credits = z.number().nonnegative();
const Courses = z.array(CourseRef).nonempty();

/**
 * 학교 기준 xlsx(졸업관련성적조회 이수내역)의 '졸업영역구분' 행 이름.
 * 이 행의 '이수기준' 값으로 min/max(영역별 최소는 영역마다)를 대체한다 (decisions.md 14번).
 * 학교 기준(general) 요구사항에만 쓴다.
 */
const PortalRows = z.array(z.string().min(1)).nonempty().optional();

const base = { id: Id, label: z.string().min(1) };

// ---------- 학점 요건 (rule_sets) ----------

export const CreditsMin = z.strictObject({
  ...base,
  type: z.literal("credits_min"),
  match: Match,
  min: Credits,
  /** 이 과목들은 분반·포털 분류와 무관하게 match 대상으로 인정 (전문교양) */
  pool: Courses.optional(),
  /** pool 과목이 포털에서 다른 분류일 때: 규칙을 따르고 경고 (decisions.md 8번) */
  pool_vs_portal: z.literal("rule_wins_with_warning").optional(),
  /** 모두 이수해야 함 */
  must_include: Courses.optional(),
  /** 각 묶음에서 하나 이상 이수해야 함 */
  must_include_any: z.array(Courses).nonempty().optional(),
  /** 미이수 시 경고만 (충족 여부에는 영향 없음) */
  warn_if_missing: Courses.optional(),
  /**
   * 과목을 지정하는 부분(must_include·must_include_any·warn_if_missing)에서 들은 과목에 붙는 포털 구분 확인.
   * 학점 합계(match)와 pool에는 적용하지 않는다. 계획 과목에도 적용하지 않는다
   */
  taken_match: Match.optional(),
  portal_rows: PortalRows,
});

export const CreditsMax = z.strictObject({
  ...base,
  type: z.literal("credits_max"),
  match: Match,
  max: Credits,
  /** "none": 초과해도 처리·경고 없음, 기준 표시만 (decisions.md 11번) */
  over_cap: z.literal("none"),
  portal_rows: PortalRows,
});

export const CohortRule = z.strictObject({
  entry_year_gte: z.number().int(),
  add_courses: Courses,
});

export const CoursesAll = z.strictObject({
  ...base,
  type: z.literal("courses_all"),
  courses: Courses,
  min_credits: Credits.optional(),
  /** 지정 과목(courses)으로 인정할 들은 과목의 포털 구분 확인 (예: 공학인증 구분 = 공학주제). 계획 과목에는 적용하지 않는다 */
  taken_match: Match.optional(),
  /** 학번별 추가 과목 (예: 2026학번+ 인공지능) */
  cohort_rules: z.array(CohortRule).nonempty().optional(),
  portal_rows: PortalRows,
});

export const GroupsEachMinCredits = z.strictObject({
  ...base,
  type: z.literal("groups_each_min_credits"),
  /** 교양영역(liberal.area) 이름 */
  groups: z.array(z.string().min(1)).nonempty(),
  min_each: Credits,
  /** 영역별 기준 (xlsx 이수기준으로 대체된 값). resolveGeneral 결과에만 생기고 규칙 파일에는 쓰지 않는다 */
  min_by_group: z.record(z.string(), Credits).optional(),
  portal_rows: PortalRows,
});

export const DesignSubstitution = z.discriminatedUnion("kind", [
  /** 인턴십을 설계학점으로 인정 — 인정 학점은 학생 입력. design_credits는 규정상 값 (입력값이 넘으면 경고) */
  z.strictObject({ kind: z.literal("internship"), design_credits: Credits, input: z.literal("manual") }),
  /** 인턴십을 캡스톤 이수로 인정 — 사용자가 직접 입력 */
  z.strictObject({ kind: z.literal("internship_as_capstone"), input: z.literal("manual") }),
]);

export const DesignCreditsMin = z.strictObject({
  ...base,
  type: z.literal("design_credits_min"),
  min: Credits,
  must_include: Courses,
  /** 설계필수·인정 기간 과목(must_include, window)으로 인정할 들은 과목의 포털 구분 확인. 설계학점 합계에는 적용하지 않는다 */
  taken_match: Match.optional(),
  /** 인정 기간: T(from) <= T(과목) <= max(T(to_max_of...)) (inclusive) */
  window: z.strictObject({
    from: CourseRef,
    to_max_of: Courses,
    inclusive: z.literal(true),
  }),
  substitutions: z.array(DesignSubstitution),
});

export const CreditRequirement = z.discriminatedUnion("type", [
  CreditsMin,
  CreditsMax,
  CoursesAll,
  GroupsEachMinCredits,
  DesignCreditsMin,
]);
export type CreditRequirement = z.infer<typeof CreditRequirement>;

// ---------- 비학점 요건 (non_credit) ----------

export const AnyOfOption = z.discriminatedUnion("kind", [
  /** 어학 시험 기준 점수 */
  z.strictObject({ kind: z.literal("test"), thresholds: z.record(z.string(), z.number().positive()) }),
  /** 전공 영어강의 수 */
  z.strictObject({
    kind: z.literal("english_lectures"),
    min_count: z.number().positive(),
    match: Match,
    /** 원어구분별 가중치 (기본 1) */
    weight: z.record(z.string(), z.number().positive()),
    excludes: z.array(z.string()),
  }),
  /** 졸업논문 심사 통과 — 사용자가 직접 체크 */
  z.strictObject({ kind: z.literal("thesis"), input: z.literal("manual") }),
  /** TOPCIT 점수 (졸업 시점 기준) */
  z.strictObject({
    kind: z.literal("topcit"),
    min_score: z.number().positive(),
    valid_years: z.number().int().positive(),
    /** graduation_until(YYYY-MM) 이전 졸업자에게 적용되던 기준 */
    history: z.array(
      z.strictObject({
        graduation_until: z.string().regex(/^\d{4}-\d{2}$/),
        min_score: z.number().positive(),
      }),
    ),
  }),
]);
export type AnyOfOption = z.infer<typeof AnyOfOption>;

export const AnyOf = z.strictObject({
  ...base,
  type: z.literal("any_of"),
  options: z.array(AnyOfOption).min(2),
});

export const ChooseN = z.strictObject({
  ...base,
  type: z.literal("choose_n"),
  n: z.number().int().positive(),
  /** 반드시 포함해야 하는 항목 id */
  must: z.array(Id),
  items: z
    .array(
      z.strictObject({
        id: Id,
        label: z.string().min(1),
        /** 이 과목 레코드(F·NP 아님)로 자동 판정. 학생 체크값은 쓰지 않는다 */
        auto_from_course: CourseRef.optional(),
      }),
    )
    .nonempty(),
});

export const Checklist = z.strictObject({
  ...base,
  type: z.literal("checklist"),
  items: z.array(z.string().min(1)).nonempty(),
});

export const CountMin = z.strictObject({
  ...base,
  type: z.literal("count_min"),
  min: z.number().int().positive(),
  /** 외부 기관 상담 등 인정 상한 */
  external_max: z.number().int().nonnegative().optional(),
});

export const NonCreditRequirement = z.discriminatedUnion("type", [AnyOf, ChooseN, Checklist, CountMin]);
export type NonCreditRequirement = z.infer<typeof NonCreditRequirement>;

/** 9가지 유형 전체 */
export const Requirement = z.union([CreditRequirement, NonCreditRequirement]);
export type Requirement = z.infer<typeof Requirement>;

export type CreditsMin = z.infer<typeof CreditsMin>;
export type CreditsMax = z.infer<typeof CreditsMax>;
export type CoursesAll = z.infer<typeof CoursesAll>;
export type GroupsEachMinCredits = z.infer<typeof GroupsEachMinCredits>;
export type DesignCreditsMin = z.infer<typeof DesignCreditsMin>;
export type AnyOf = z.infer<typeof AnyOf>;
export type ChooseN = z.infer<typeof ChooseN>;
export type Checklist = z.infer<typeof Checklist>;
export type CountMin = z.infer<typeof CountMin>;
