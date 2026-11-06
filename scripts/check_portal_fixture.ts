/**
 * 4단계 통합 검증 보고 — 본인 파일(docs/private) → 파서 → 엔진 → 정답 22개 대조표.
 * 실행: npx tsx scripts/check_portal_fixture.ts
 * 출력은 숫자·항목명·종류별 개수만 (과목명·성적·이름·학번 없음).
 */
import { compareWithExpected, portalValues, type PortalValue } from "../src/engine/portal-compare";
import { evaluatePrivate, loadExpected, loadPrivatePortal, privateFiles } from "../src/validation/private-data";

const fmt = (v: PortalValue | undefined) => (v === undefined ? "-" : Array.isArray(v) ? `${v[0]}/${v[1]}` : String(v));

/** 경고·메모 종류 (과목명 등 개별 정보는 버린다) */
const KINDS: [RegExp, string][] = [
  [/포털 공학인증 구분 .* 규칙상/, "pool 과목 포털 구분 불일치 (규칙 적용 + 경고)"],
  [/미이수 — 확인 권장/, "권장 과목 미이수"],
  [/이름으로 매칭됨/, "이름으로 매칭됨"],
  [/근사치/, "TOPCIT 기준점 근사치"],
  [/수동 입력 반영/, "수동 입력 반영"],
  [/규정상 값/, "인턴십 설계학점 입력값 확인"],
];
const kindOf = (s: string) => KINDS.find(([re]) => re.test(s))?.[1] ?? "기타";
const countBy = (xs: string[]) => xs.reduce<Record<string, number>>((m, x) => ((m[x] = (m[x] ?? 0) + 1), m), {});

async function main() {
  const { files, available } = privateFiles(process.argv[2]);
  if (!available) throw new Error("docs/private 파일 3개가 필요합니다");
  const portal = await loadPrivatePortal(files);
  const out = evaluatePrivate(portal);
  const expected = loadExpected();
  const rule = portalValues(out, "rule");
  const rows = compareWithExpected({ abeek: expected.abeek, general: expected.general }, portalValues(out, "portal"));

  console.log(`과목 ${portal.records.length} · 한쪽 문서에만 ${portal.merged.only_abeek_status.length + portal.merged.only_grad_detail.length} · 못 읽은 줄 ${portal.unparsed} · 합치기 경고 ${portal.merged.warnings.length} · 학교 기준 ${out.general.basis}`);
  console.log("");
  console.log("| # | 구분 | 항목 | 정답 | 엔진(포털 기준) | 일치 | 엔진(규칙 적용) |");
  console.log("|---|---|---|---|---|---|---|");
  rows.forEach((r, i) => {
    const rv = rule[r.set][r.key];
    const differs = JSON.stringify(rv) !== JSON.stringify(r.actual);
    console.log(`| ${i + 1} | ${r.set === "abeek" ? "공학인증" : "학교"} | ${r.key} | ${fmt(r.expected)} | ${fmt(r.actual)} | ${r.ok ? "O" : "X"} | ${differs ? fmt(rv) : ""} |`);
  });
  console.log(`\n일치 ${rows.filter((r) => r.ok).length}/${rows.length}`);

  const results = [...out.general.results, ...out.abeek, ...out.non_credit];
  console.log("\n상태:", JSON.stringify(countBy(results.map((r) => r.status))));
  for (const [label, rs] of [["학교", out.general.results], ["공학인증", out.abeek], ["비학점", out.non_credit]] as const) {
    console.log(`  ${label}:`, JSON.stringify(countBy(rs.map((r) => r.status))));
  }
  console.log("경고:", JSON.stringify(countBy(results.flatMap((r) => r.warnings).map(kindOf))));
  console.log("메모:", JSON.stringify(countBy(results.flatMap((r) => r.notes).map(kindOf))));
  console.log("알 수 없는 기준(xlsx 행):", out.general.unknown_rows.length);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
