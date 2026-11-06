import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  EvidenceFile,
  ExpectedFile,
  LIBERAL_AREAS,
  LiberalCatalog,
  MajorCatalog,
  REQUIREMENT_TYPES,
  RuleFile,
  type Match,
  type Requirement,
} from "./index";

const ROOT = join(__dirname, "../../..");
const readJson = (rel: string): unknown => JSON.parse(readFileSync(join(ROOT, rel), "utf8"));

const rules = RuleFile.parse(readJson("data/rules/cau_sw_2022.rules.json"));
const evidence = EvidenceFile.parse(readJson("data/rules/cau_sw_2022.evidence.json"));
const expected = ExpectedFile.parse(readJson("data/rules/cau_sw_2022.expected.json"));
const major = MajorCatalog.parse(readJson("data/catalog/courses_cau_sw.json"));
const liberal = LiberalCatalog.parse(readJson("data/catalog/liberal_arts_2026_1.json"));

const allRequirements: Requirement[] = [
  ...rules.rule_sets.general.requirements,
  ...rules.rule_sets.abeek.requirements,
  ...rules.non_credit,
];

/** 규칙이 가리킬 수 있는 과목 이름 (전공 key·이름·별칭 + 교양 이름·별칭) */
const knownCourses = new Set<string>([
  ...major.courses.flatMap((c) => [c.key, c.name, ...c.aliases]),
  ...liberal.common.flatMap((c) => [c.name, ...c.aliases]),
  ...liberal.courses.map((c) => c.name),
  ...liberal.other.map((c) => c.name),
]);

function courseRefs(r: Requirement): string[] {
  const refs: string[] = [];
  const fromMatch = (m: Match) => {
    if (m !== "all" && m.course) refs.push(...m.course);
  };
  switch (r.type) {
    case "credits_min":
      fromMatch(r.match);
      refs.push(...(r.pool ?? []), ...(r.must_include ?? []), ...(r.must_include_any ?? []).flat(), ...(r.warn_if_missing ?? []));
      break;
    case "credits_max":
      fromMatch(r.match);
      break;
    case "courses_all":
      refs.push(...r.courses, ...(r.cohort_rules ?? []).flatMap((c) => c.add_courses));
      break;
    case "design_credits_min":
      refs.push(...r.must_include, r.window.from, ...r.window.to_max_of);
      break;
    case "any_of":
      r.options.forEach((o) => o.kind === "english_lectures" && fromMatch(o.match));
      break;
  }
  return refs;
}

function matches(r: Requirement): Match[] {
  if ("match" in r) return [r.match];
  if (r.type === "any_of") return r.options.flatMap((o) => ("match" in o ? [o.match] : []));
  return [];
}

describe("스키마 검증 (5개 파일)", () => {
  it("규칙·근거·정답·카탈로그 파일이 스키마를 통과한다", () => {
    // 위의 parse()가 실패하면 모듈 로드 단계에서 예외가 난다. 여기서는 결과만 확인.
    expect(rules.meta.version).toBe("0.13-draft");
    expect(major.courses.length).toBeGreaterThan(0);
    expect(liberal.courses.length).toBeGreaterThan(0);
  });

  it("요구사항 9가지 유형이 모두 규칙 파일에 쓰인다", () => {
    expect(new Set(allRequirements.map((r) => r.type))).toEqual(new Set(REQUIREMENT_TYPES));
  });

  it("세 파일의 규칙 버전이 같다", () => {
    expect(evidence.rules_version).toBe(rules.meta.version);
    expect(expected.rules_version).toBe(rules.meta.version);
  });
});

describe("규칙 ↔ 근거 기록", () => {
  it("모든 요구사항에 근거 기록이 있고, 근거 기록의 id는 모두 규칙에 있다", () => {
    expect(Object.keys(evidence.requirements).sort()).toEqual(allRequirements.map((r) => r.id).sort());
  });

  it("모든 요구사항 근거에 출처가 있다", () => {
    const missing = Object.entries(evidence.requirements).filter(([, e]) => !e.source).map(([id]) => id);
    expect(missing).toEqual([]);
  });

  it("출처 id는 중복되지 않는다", () => {
    const ids = evidence.sources.map((s) => s.id);
    expect(ids.length).toBe(new Set(ids).size);
  });
});

describe("규칙 ↔ 카탈로그", () => {
  it("규칙이 가리키는 과목은 모두 카탈로그에 있다", () => {
    const missing = allRequirements.flatMap((r) => courseRefs(r).filter((c) => !knownCourses.has(c)).map((c) => `${r.id}: ${c}`));
    expect(missing).toEqual([]);
  });

  it("match의 분류 값은 규칙 classification에 정의되어 있다", () => {
    const { general_categories, abeek_categories, category_groups } = rules.classification;
    const generalOk = new Set([...general_categories, ...Object.keys(category_groups)]);
    const areaOk = new Set<string>([...general_categories, ...LIBERAL_AREAS]);
    const bad: string[] = [];
    for (const r of allRequirements) {
      for (const m of matches(r)) {
        if (m === "all") continue;
        m["general.category"]?.forEach((v) => generalOk.has(v) || bad.push(`${r.id}: general.category ${v}`));
        m["abeek.category"]?.forEach((v) => abeek_categories.includes(v) || bad.push(`${r.id}: abeek.category ${v}`));
        m["liberal.area"]?.forEach((v) => areaOk.has(v) || bad.push(`${r.id}: liberal.area ${v}`));
        const p = m["liberal.area_prefix"];
        if (p && !LIBERAL_AREAS.some((a) => a.startsWith(p))) bad.push(`${r.id}: liberal.area_prefix ${p}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("영역별 최소의 영역은 교양 카탈로그에 있는 영역이다", () => {
    const areas = new Set<string>(liberal.courses.map((c) => c.area));
    const bad = allRequirements.flatMap((r) => (r.type === "groups_each_min_credits" ? r.groups.filter((g) => !areas.has(g)) : []));
    expect(bad).toEqual([]);
  });

  it("전공 카탈로그의 key·별칭은 과목끼리 겹치지 않는다", () => {
    const owner = new Map<string, string>();
    const clash: string[] = [];
    for (const c of major.courses) {
      for (const n of new Set([c.key, c.name, ...c.aliases])) {
        const prev = owner.get(n);
        if (prev && prev !== c.key) clash.push(`${n}: ${prev} / ${c.key}`);
        owner.set(n, c.key);
      }
    }
    expect(clash).toEqual([]);
  });
});

describe("요구사항 내부 일관성", () => {
  it("choose_n: must는 items 안에 있고 n은 항목 수 이하", () => {
    for (const r of allRequirements) {
      if (r.type !== "choose_n") continue;
      const ids = r.items.map((i) => i.id);
      expect(r.must.filter((m) => !ids.includes(m))).toEqual([]);
      expect(r.n).toBeLessThanOrEqual(ids.length);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("설계: 인정 기간의 시작·끝 과목은 설계필수 과목이다", () => {
    for (const r of allRequirements) {
      if (r.type !== "design_credits_min") continue;
      expect(r.must_include).toContain(r.window.from);
      for (const c of r.window.to_max_of) expect(r.must_include).toContain(c);
    }
  });

  it("학번 처리: 공학인증은 지원 학번 시작부터 적용되고, cohort_rules는 지원 범위 안이다", () => {
    const { from, to } = rules.meta.supported_entry_years;
    expect(rules.rule_sets.abeek.applies_when.entry_year_gte).toBe(from);
    const years = rules.rule_sets.abeek.requirements.flatMap((r) => (r.type === "courses_all" ? (r.cohort_rules ?? []).map((c) => c.entry_year_gte) : []));
    for (const y of years) expect(y >= from && y <= to).toBe(true);
    const d = rules.rule_sets.general.basis.default_entry_year;
    expect(d >= from && d <= to).toBe(true);
  });
});

describe("학교 기준 xlsx 행 연결 (portal_rows)", () => {
  const rows = rules.rule_sets.general.requirements.flatMap((r) => ("portal_rows" in r ? (r.portal_rows ?? []) : []));

  it("행 이름은 요구사항끼리 겹치지 않는다", () => {
    expect(rows.length).toBe(new Set(rows).size);
  });

  it("행 이름은 모두 정답 파일(학교 기준)의 항목이다", () => {
    expect(rows.filter((r) => !(r in expected.general))).toEqual([]);
  });

  it("영역별 최소는 영역마다 한 행씩 연결된다", () => {
    for (const r of rules.rule_sets.general.requirements) {
      if (r.type === "groups_each_min_credits" && r.portal_rows) expect(r.portal_rows).toEqual(r.groups);
    }
  });
});

describe("정답 파일", () => {
  it("포털 숫자 22개 = 공학인증 7 + 학교 기준 15", () => {
    expect(Object.keys(expected.abeek)).toHaveLength(7);
    expect(Object.keys(expected.general)).toHaveLength(15);
  });
});

describe("엔진 독립성", () => {
  it("src/engine은 React·Next를 import하지 않는다", () => {
    const dir = join(ROOT, "src/engine");
    const files = readdirSync(dir, { recursive: true, encoding: "utf8" }).filter((f) => /\.tsx?$/.test(f) && !f.endsWith(".test.ts"));
    const bad = files.filter((f) => /from\s+["'](react|react-dom|next)(\/|["'])/.test(readFileSync(join(dir, f), "utf8")));
    expect(bad).toEqual([]);
  });
});
