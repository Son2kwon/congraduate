import { z } from "zod";

/**
 * 통합 검증 정답 (data/rules/<id>.expected.json). 포털에 표시된 숫자만 담는다 (decisions.md 12번).
 * 값은 [취득, 기준] 또는 취득만.
 */
const Value = z.union([z.tuple([z.number(), z.number()]), z.number()]);

export const ExpectedFile = z.strictObject({
  rules_version: z.string().min(1),
  note: z.string(),
  format: z.string(),
  abeek: z.record(z.string(), Value),
  general: z.record(z.string(), Value),
});
export type ExpectedFile = z.infer<typeof ExpectedFile>;
