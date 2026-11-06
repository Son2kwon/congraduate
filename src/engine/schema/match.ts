import { z } from "zod";

/**
 * 과목 참조. 지금은 카탈로그의 과목명 key(또는 aliases)로 가리킨다.
 * 과목코드 연결은 sprint.md 3단계(파서)에서 한다 (decisions.md 10번: 과목은 과목코드로 식별).
 */
export const CourseRef = z.string().min(1);
export type CourseRef = z.infer<typeof CourseRef>;

/**
 * 과목 선택 조건. 키끼리는 AND, 배열 안의 값끼리는 OR.
 * - "all": 모든 이수 과목
 * - general.category: 일반 이수구분 (classification.category_groups의 묶음 이름도 허용, 예: "교양")
 * - abeek.category: 공학인증 구분
 * - liberal.area: 교양영역 (예: "공통교양", "핵심-도전")
 * - liberal.area_prefix: 교양영역 접두어 (예: "선택-")
 * - course: 특정 과목
 */
export const MatchFilter = z
  .strictObject({
    "general.category": z.array(z.string().min(1)).nonempty().optional(),
    "abeek.category": z.array(z.string().min(1)).nonempty().optional(),
    "liberal.area": z.array(z.string().min(1)).nonempty().optional(),
    "liberal.area_prefix": z.string().min(1).optional(),
    course: z.array(CourseRef).nonempty().optional(),
  })
  .refine((m) => Object.keys(m).length > 0, { message: "match 조건이 비어 있음" });
export type MatchFilter = z.infer<typeof MatchFilter>;

export const Match = z.union([z.literal("all"), MatchFilter]);
export type Match = z.infer<typeof Match>;
