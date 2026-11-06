import { z } from "zod";

/**
 * 근거 기록 파일 (data/rules/<id>.evidence.json). 사람이 읽는 출처·메모·이력.
 * 엔진은 판정에 이 파일을 쓰지 않는다. 내용이 자유로운 텍스트라 하위 구조는 느슨하게 둔다.
 */
const Text = z.string().min(1);

export const Source = z.looseObject({
  id: Text,
  title: Text,
});

export const RequirementEvidence = z.looseObject({
  /** 출처 (meta.sources의 id와 조문·페이지를 섞어 쓴 자유 텍스트) */
  source: Text.optional(),
  confidence: z.enum(["high", "medium", "low"]).optional(),
  note: Text.optional(),
});
export type RequirementEvidence = z.infer<typeof RequirementEvidence>;

export const EvidenceFile = z.strictObject({
  $schema_note: z.string().optional(),
  /** 짝이 되는 규칙 파일의 meta.version */
  rules_version: Text,
  meta: z.record(z.string(), z.unknown()),
  sources: z.array(Source).nonempty(),
  classification: z.record(z.string(), z.unknown()),
  rule_sets: z.record(z.string(), z.record(z.string(), z.unknown())),
  /** 요구사항 id → 근거 */
  requirements: z.record(z.string(), RequirementEvidence),
  removed: z.array(z.strictObject({ label: Text, reason: Text })),
  multi_major: z.record(z.string(), z.unknown()),
  open_questions: z.array(Text),
  counting_policy: z.record(z.string(), z.string()),
  resolved_conflicts: z.array(z.strictObject({ item: Text, resolution: Text })),
  transcript_format: z.record(z.string(), z.unknown()),
  english_lecture_source: Text,
  import_sources: z.record(z.string(), z.string()),
  changelog: z
    .array(z.strictObject({ version: Text, date: z.string(), changes: z.array(Text) }))
    .optional(),
});
export type EvidenceFile = z.infer<typeof EvidenceFile>;
