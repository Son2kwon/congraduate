/**
 * 4단계 통합 검증 (1차 관문): 본인 파일 3개 → 파서 → 엔진 → expected.json 22개 숫자.
 * - docs/private 파일이 없으면 전체 skip
 * - 실패 메시지에는 항목 이름(포털 영역명)과 숫자만 나온다
 */
import { beforeAll, describe, expect, it } from "vitest";
import type { EvaluateOutput } from "../engine/evaluate";
import { compareWithExpected, portalValues } from "../engine/portal-compare";
import { evaluatePrivate, loadExpected, loadPrivatePortal, privateFiles } from "./private-data";

const { files, available } = privateFiles();

describe.skipIf(!available)("포털 숫자 22개 재현 (docs/private, 로컬 전용)", () => {
  const expected = loadExpected();
  let out: EvaluateOutput;

  beforeAll(async () => {
    out = evaluatePrivate(await loadPrivatePortal(files));
  }, 60_000);

  it("학교 기준은 xlsx 값으로 판정했다", () => {
    expect(out.general.basis).toBe("xlsx");
  });

  it("포털 기준 값이 정답 22개와 모두 일치", () => {
    const rows = compareWithExpected({ abeek: expected.abeek, general: expected.general }, portalValues(out, "portal"));
    expect(rows).toHaveLength(22);
    expect(rows.filter((r) => !r.ok).map((r) => `${r.set}.${r.key}`)).toEqual([]);
  });

  it("규칙 적용 값: 전문교양 8/6, 인증총합 72/84, 미지정 39 (decisions.md 8번)", () => {
    const v = portalValues(out, "rule").abeek;
    expect(v["전문교양"]).toEqual([8, 6]);
    expect(v["인증총합"]).toEqual([72, 84]);
    expect(v["미지정"]).toBe(39);
  });

  it("규칙 적용과 포털 기준이 다른 항목은 전문교양·인증총합·미지정 3개뿐", () => {
    const portal = portalValues(out, "portal");
    const rule = portalValues(out, "rule");
    const diff = (["abeek", "general"] as const).flatMap((s) =>
      Object.keys(portal[s]).filter((k) => JSON.stringify(portal[s][k]) !== JSON.stringify(rule[s][k])).map((k) => `${s}.${k}`),
    );
    expect(diff.sort()).toEqual(["abeek.미지정", "abeek.인증총합", "abeek.전문교양"].sort());
  });
});
