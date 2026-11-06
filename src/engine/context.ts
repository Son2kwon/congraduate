import type { CourseIndex } from "./courses";
import type { Season, StudentInfo } from "./types";

/** 판정 함수들이 공유하는 문맥 */
export type EvalContext = {
  /** 규칙 counting.term_order */
  termOrder: Season[];
  /** 규칙 classification.category_groups */
  categoryGroups: Record<string, string[]>;
  courses: CourseIndex;
  student: StudentInfo;
};
