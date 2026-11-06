import type { LiberalCatalog, MajorCatalog } from "./schema";

/** 과목명 정규화: 공백 제거 + 대문자 */
export const normalizeName = (name: string): string => name.replace(/\s+/g, "").toUpperCase();

/**
 * 과목명 → 대표 이름. 카탈로그의 key·이름·별칭을 같은 과목으로 묶는다.
 * 카탈로그에 없는 이름은 정규화한 이름 그대로 쓴다.
 */
export type CourseIndex = { canonical(name: string): string };

export function createCourseIndex(major: MajorCatalog, liberal: LiberalCatalog): CourseIndex {
  const map = new Map<string, string>();
  const add = (canon: string, names: string[]) => {
    for (const n of names) {
      const k = normalizeName(n);
      if (!map.has(k)) map.set(k, normalizeName(canon));
    }
  };
  for (const c of major.courses) add(c.key, [c.key, c.name, ...c.aliases]);
  for (const c of liberal.common) add(c.name, [c.name, ...c.aliases]);
  for (const c of liberal.courses) add(c.name, [c.name]);
  for (const c of liberal.other) add(c.name, [c.name]);
  return {
    canonical: (name) => {
      const k = normalizeName(name);
      return map.get(k) ?? k;
    },
  };
}
