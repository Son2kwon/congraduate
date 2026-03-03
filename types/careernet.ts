// ── 학교 정보 (svcCode=SCHOOL) ────────────────────────────────────────────
export interface CareerNetSchool {
  seq: string;
  schoolName: string;
  schoolType: string;
  schoolGubun: string;
  campusName: string;
  region: string;
  adres: string;
  link: string;
  collegeinfourl: string;
  estType: string;
  totalCount: string;
}

// ── 학과 카테고리 목록 (svcCode=MAJOR, gubun=univ_list) ───────────────────
export interface CareerNetDepartment {
  majorSeq: string;
  lClass: string;     // 계열 (대분류)
  mClass: string;     // 학과 카테고리명
  facilName: string;  // 세부학과명 (쉼표 구분)
  totalCount: string;
}

// ── 학과 상세 (svcCode=MAJOR_VIEW) ───────────────────────────────────────
export interface MajorViewUniversity {
  area: string;
  schoolName: string;
  campus_nm: string;   // 캠퍼스명
  majorName: string;   // 해당 학교의 실제 학과명
  totalCount: string;
  schoolURL: string;
}

export interface MajorViewContent {
  major?: string;
  university?: MajorViewUniversity | MajorViewUniversity[];
  [key: string]: unknown;
}

export interface MajorViewApiResponse {
  dataSearch: {
    // CareerNet API는 MAJOR_VIEW도 content를 배열로 반환
    content: MajorViewContent | MajorViewContent[];
  };
}

// ── 학교 필터 결과: 특정 학교에 개설된 학과 ───────────────────────────────
export interface SchoolDepartment {
  majorSeq: string;
  mClass: string;     // 학과 카테고리
  lClass: string;     // 계열
  majorName: string;  // 해당 학교의 실제 학과명 (MAJOR_VIEW.university.majorName)
  campusName: string; // 해당 학교의 캠퍼스명
}

// ── API 응답 래퍼 ─────────────────────────────────────────────────────────
export interface SchoolsApiResponse {
  dataSearch: {
    content: CareerNetSchool[];
  };
}

export interface DepartmentsApiResponse {
  dataSearch: {
    content: CareerNetDepartment[];
  };
}
