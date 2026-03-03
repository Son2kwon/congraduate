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
  totalCount: string; // 전체 검색 결과수 (각 content 항목 내 포함)
}

export interface CareerNetDepartment {
  majorSeq: string;
  lClass: string;    // 계열 (대분류)
  mClass: string;    // 학과 (표시 이름)
  facilName: string; // 세부학과명
  totalCount: string; // 전체 검색 결과수 (각 content 항목 내 포함)
}

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
