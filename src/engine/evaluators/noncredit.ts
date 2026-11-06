import type { EvalContext } from "../context";
import { earnedRecords, matchesRecord } from "../records";
import type { AnyOf, AnyOfOption, Checklist, ChooseN, CountMin } from "../schema";
import type { CourseRecord, OptionResult, RequirementResult, Status, Term } from "../types";
import { counted, courseState, newResult, statusOf, sumValue, type CourseState } from "./result";

// ---------- any_of (택1) ----------

/** 예정 졸업 학기 → 졸업 연월. 1·S학기 졸업 = 그해 8월, 2·W학기 졸업 = 다음 해 2월 */
export function graduationMonth(t: Term): { year: number; month: number } {
  return t.season === "1" || t.season === "S" ? { year: t.year, month: 8 } : { year: t.year + 1, month: 2 };
}

const ym = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;

type OptionEval = OptionResult & { counted?: ReturnType<typeof counted>[]; note?: string };

function evalOption(o: AnyOfOption, records: CourseRecord[], c: EvalContext): OptionEval {
  const m = c.student.manual;
  switch (o.kind) {
    case "test": {
      const passed = m.language_tests.filter((x) => o.thresholds[x.kind] !== undefined && x.score >= o.thresholds[x.kind]!);
      const best = passed[0] ?? m.language_tests[0];
      return {
        kind: o.kind,
        status: passed.length ? "met" : "unmet",
        current: best?.score ?? 0,
        required: best ? (o.thresholds[best.kind] ?? 0) : 0,
        detail: passed.length ? `${passed[0]!.kind} ${passed[0]!.score}` : "기준 점수 이상 어학 성적 없음",
      };
    }
    case "english_lectures": {
      const cs = earnedRecords(records, c)
        .filter((r) => r.english && matchesRecord(o.match, r, c))
        .map((r) => counted(r, o.weight[`영어강의${r.english}`] ?? 1));
      const current = sumValue(cs, false);
      const planned = sumValue(cs, true);
      return {
        kind: o.kind,
        status: statusOf(current >= o.min_count, current + planned >= o.min_count),
        current,
        required: o.min_count,
        detail: `전공 영어강의 ${current}${planned ? ` (+계획 ${planned})` : ""} / ${o.min_count}`,
        counted: cs,
      };
    }
    case "thesis":
      return {
        kind: o.kind,
        status: m.thesis_passed ? "met" : "unmet",
        current: m.thesis_passed ? 1 : 0,
        required: 1,
        detail: m.thesis_passed ? "졸업논문 통과" : "졸업논문 미통과",
      };
    case "topcit": {
      const g = graduationMonth(c.student.expected_graduation);
      const gradYm = ym(g.year, g.month);
      // history: graduation_until(포함) 이전 졸업자에게 적용되던 기준
      const old = [...o.history].sort((a, b) => a.graduation_until.localeCompare(b.graduation_until)).find((h) => gradYm <= h.graduation_until);
      const minScore = old?.min_score ?? o.min_score;
      // 기준점 = 제출 시점 근사치 (졸업 월 - 3개월). 근거: notice_3494 (evidence nc_thesis.topcit_cutoff)
      const s = addMonths(g, -TOPCIT_SUBMIT_MONTHS_BEFORE);
      const cutoff = `${ym(s.year - o.valid_years, s.month)}-01`;
      const enough = m.topcit.filter((x) => x.score >= minScore);
      const valid = enough.filter((x) => x.date !== null && x.date >= cutoff);
      const undated = enough.filter((x) => x.date === null);
      const status: Status = valid.length ? "met" : undated.length ? "needs_review" : "unmet";
      return {
        kind: o.kind,
        status,
        current: Math.max(0, ...m.topcit.map((x) => x.score)),
        required: minScore,
        detail:
          status === "needs_review"
            ? `TOPCIT ${undated[0]!.score}점 — 응시일 입력 필요 (${cutoff} 이후 응시분만 인정)`
            : `TOPCIT ${minScore}점 이상, ${cutoff} 이후 응시 (${gradYm} 졸업 기준)`,
        note: `TOPCIT 유효기간 기준점은 제출 시점 근사치 (${gradYm} 졸업 → ${ym(s.year, s.month)} 기준 ${o.valid_years}년)`,
      };
    }
  }
}

/** TOPCIT 제출 시점 근사: 졸업 월보다 몇 개월 앞 (2027.2 졸업 → 2026.11 제출) */
const TOPCIT_SUBMIT_MONTHS_BEFORE = 3;

function addMonths(d: { year: number; month: number }, n: number): { year: number; month: number } {
  const i = d.year * 12 + (d.month - 1) + n;
  return { year: Math.floor(i / 12), month: (i % 12) + 1 };
}

const STATUS_RANK: Status[] = ["met", "tentative", "needs_review", "unmet"];

/** 택1: 선택지 중 가장 나은 상태 (충족 > 잠정 > 확인 필요 > 미충족) */
export function evalAnyOf(req: AnyOf, records: CourseRecord[], c: EvalContext): RequirementResult {
  const results = req.options.map((o) => evalOption(o, records, c));
  const status = STATUS_RANK.find((s) => results.some((r) => r.status === s)) ?? "unmet";
  const options: OptionResult[] = results.map(({ counted: _c, note: _n, ...o }) => o);
  return newResult(req, {
    status,
    current: results.filter((r) => r.status === "met").length,
    required: 1,
    counted: results.flatMap((r) => r.counted ?? []),
    reasons: status === "met" ? [] : results.map((r) => r.detail),
    notes: results.flatMap((r) => (r.note ? [r.note] : [])),
    options,
  });
}

// ---------- choose_n (n개 중 선택) ----------

export function evalChooseN(req: ChooseN, records: CourseRecord[], c: EvalContext): RequirementResult {
  const earned = earnedRecords(records, c);
  const checked = new Set(c.student.manual.checked[req.id] ?? []);
  const states = req.items.map((item) => {
    // auto_from_course가 있으면 과목 레코드로만 판정 (체크값 무시)
    const course = item.auto_from_course;
    const state: CourseState = course ? courseState(course, earned, c) : checked.has(item.id) ? "done" : "missing";
    return { id: item.id, label: item.label, state };
  });
  const done = states.filter((s) => s.state === "done");
  const planned = states.filter((s) => s.state === "planned");
  const mustState = (id: string) => states.find((s) => s.id === id)?.state ?? "missing";
  const missingMust = req.must.filter((id) => mustState(id) === "missing");

  const status = statusOf(
    done.length >= req.n && req.must.every((id) => mustState(id) === "done"),
    done.length + planned.length >= req.n && missingMust.length === 0,
  );
  const short = Math.max(0, req.n - done.length - planned.length);
  return newResult(req, {
    status,
    current: done.length,
    planned: planned.length,
    required: req.n,
    missing: { courses: [], credits: 0, items: missingMust },
    reasons: [
      ...missingMust.map((id) => `필수 항목 미충족: ${states.find((s) => s.id === id)?.label ?? id}`),
      ...(short > 0 ? [`${short}개 더 필요`] : []),
    ],
  });
}

// ---------- checklist ----------

export function evalChecklist(req: Checklist, _records: CourseRecord[], c: EvalContext): RequirementResult {
  const checked = new Set(c.student.manual.checked[req.id] ?? []);
  const missing = req.items.filter((i) => !checked.has(i));
  return newResult(req, {
    status: missing.length === 0 ? "met" : "unmet",
    current: req.items.length - missing.length,
    required: req.items.length,
    missing: { courses: [], credits: 0, items: missing },
    reasons: missing.map((i) => `${i} 미체크`),
  });
}

// ---------- count_min (횟수) ----------

export function evalCountMin(req: CountMin, _records: CourseRecord[], c: EvalContext): RequirementResult {
  const input = c.student.manual.counts[req.id] ?? { main: 0, external: 0 };
  const external = Math.min(input.external, req.external_max ?? Infinity);
  const current = input.main + external;
  const short = Math.max(0, req.min - current);
  return newResult(req, {
    status: short === 0 ? "met" : "unmet",
    current,
    required: req.min,
    reasons: [
      ...(short > 0 ? [`${short}회 부족`] : []),
      ...(input.external > external ? [`외부 기관 상담은 ${req.external_max}회까지만 인정 (입력 ${input.external}회)`] : []),
    ],
  });
}
