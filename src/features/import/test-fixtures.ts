import type { CourseRecord } from "../../engine/types";

// 개인 자료와 무관하게 손으로 만든 예제. 테스트에서만 사용한다.
export const example: CourseRecord = {
  code: "11111", section: "01", name: "가상과목", term: { year: 2024, season: "1" },
  credits: 3, design_credits: 1, grade: "B0", general_category: null, liberal_area: null,
  abeek_category: "공학주제", english: null, retake: false, source: "abeek_status",
};
