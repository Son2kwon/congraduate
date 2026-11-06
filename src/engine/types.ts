/**
 * 판정 엔진 입력·출력 타입.
 * 3단계 파서와 수동 입력, 8단계 수강 계획이 모두 CourseRecord를 만든다.
 */

// ---------- 학기 ----------

export type Season = "1" | "S" | "2" | "W";
/** 학기. 순서는 규칙 파일 counting.term_order (1 < S < 2 < W) */
export type Term = { year: number; season: Season };

// ---------- 입력: 과목 레코드 ----------

/** 레코드 출처. "plan"은 수강 계획 과목 — 결과에서 따로 보여 준다 */
export type RecordSource = "abeek_status" | "grad_detail" | "manual" | "plan";

/** 원어구분. A = 영어강의 1, B = 0.5 (가중치는 규칙 nc_english) */
export type EnglishLecture = "A" | "B" | null;

export type CourseRecord = {
  /**
   * 과목코드. 과목 식별 기준 (이름이 같아도 코드가 다르면 다른 과목).
   * 카탈로그에 코드가 없는 계획 과목은 null — 이때만 과목명으로 식별한다.
   */
  code: string | null;
  section: string | null;
  name: string;
  term: Term;
  credits: number;
  /** 설계학점. 들은 과목 = 포털 이수현황 값, 계획 과목 = 카탈로그 design_credits 현재 값 */
  design_credits: number;
  /** "A+" … "F", "P", "NP". 계획 과목은 null */
  grade: string | null;
  /** 일반 이수구분 (전공기초·전공필수·전공·공통교양·핵심교양·선택교양·자유선택 …) */
  general_category: string | null;
  /** 교양영역 (공통교양, 핵심-도전, 선택-소통 …). 교양이 아니면 null */
  liberal_area: string | null;
  /** 공학인증 구분 (전문교양·BSM·공학주제·기타·미지정) */
  abeek_category: string | null;
  english: EnglishLecture;
  /** 이수현황 '재수강 여부' = O */
  retake: boolean;
  source: RecordSource;
};

// ---------- 입력: 학생 정보 ----------

export type DatedScore = { score: number; /** YYYY-MM-DD. 모르면 null → 확인 필요 */ date: string | null };

export type StudentInfo = {
  entry_year: number;
  /** 예정 졸업 학기 (1·S → 그해 8월 졸업, 2·W → 다음 해 2월 졸업) */
  expected_graduation: Term;
  manual: ManualInput;
};

/** 학생이 직접 입력·체크하는 비학점 항목 (decisions.md 5번) */
export type ManualInput = {
  /** 어학 시험. kind는 규칙 nc_english thresholds의 키 (TOEIC, TEPS …) */
  language_tests: (DatedScore & { kind: string })[];
  topcit: DatedScore[];
  thesis_passed: boolean;
  /**
   * 횟수 요건(count_min) 입력. 키 = 요구사항 id.
   * 예: nc_counseling → { main: 지도교수 상담, external: 교내 상담센터 등 }
   */
  counts: Record<string, { main: number; external: number }>;
  /**
   * 체크 입력(checklist·choose_n). 키 = 요구사항 id.
   * checklist는 항목 문자열, choose_n은 항목 id. 자동 판정 항목은 체크값 대신 과목 레코드로 판정
   */
  checked: Record<string, string[]>;
};

// ---------- 출력 ----------

/**
 * - met: 충족
 * - unmet: 미충족
 * - tentative: 잠정 — 계획 과목이나 아직 닫히지 않은 기간에 기대고 있음
 * - needs_review: 확인 필요 — 판정에 필요한 정보가 비어 있음 (예: 응시일 미입력)
 */
export type Status = "met" | "unmet" | "tentative" | "needs_review";

export type CountedCourse = {
  code: string | null;
  name: string;
  term: Term;
  /** 이 요구사항에 반영된 값 (학점·설계학점·영어강의 가중치 등) */
  value: number;
  planned: boolean;
};

export type GroupResult = { group: string; current: number; planned: number; required: number; met: boolean };

export type RequirementResult = {
  id: string;
  label: string;
  type: string;
  status: Status;
  /** 들은 과목·입력 기준 현재값 (계획 제외) */
  current: number;
  /** 계획 과목이 더하는 값 */
  planned: number;
  /** 기준값 (최소·최대·과목 수·항목 수 …) */
  required: number;
  counted: CountedCourse[];
  missing: { courses: string[]; credits: number; items: string[] };
  /** 미충족·잠정 사유 */
  reasons: string[];
  warnings: string[];
  /** 영역별 최소의 영역별 결과 */
  groups?: GroupResult[];
  /** 택1의 선택지별 결과 */
  options?: OptionResult[];
};

export type OptionResult = { kind: string; status: Status; current: number; required: number; detail: string };
