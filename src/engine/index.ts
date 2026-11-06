// 판정 엔진 진입점. React 등 UI 라이브러리에 의존하지 않는 순수 TypeScript.
export * from "./types";
export * from "./schema";
export { createCourseIndex, normalizeName, type CourseIndex } from "./courses";
export { compareTerm, termLabel, isFailed, isPlanned, effectiveRecords, earnedRecords } from "./records";
export { evaluate, resolveGeneral, type EvaluateInput, type EvaluateOutput } from "./evaluate";
export { graduationMonth } from "./evaluators/noncredit";
