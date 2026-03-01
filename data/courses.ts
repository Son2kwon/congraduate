import type { Course, MajorStats } from '@/types/dashboard';

// ─── 과목 더미 데이터 ────────────────────────────────────────────────────────
export const COURSES: Course[] = [
  // ── 소프트웨어학부 ────────────────────────────────────────────────────────
  // 전공기초 (12/12학점 이수)
  { id: 'sw-f01', name: '프로그래밍원리', category: '전공기초', credits: 3, grade: 'A+', completed: true, major: 'software' },
  { id: 'sw-f02', name: '이산수학', category: '전공기초', credits: 3, grade: 'A0', completed: true, major: 'software' },
  { id: 'sw-f03', name: '선형대수', category: '전공기초', credits: 3, grade: 'B+', completed: true, major: 'software' },
  { id: 'sw-f04', name: '확률과통계', category: '전공기초', credits: 3, grade: 'B0', completed: true, major: 'software' },
  // 전공필수 (24/30학점 이수)
  { id: 'sw-r01', name: '자료구조', category: '전공필수', credits: 3, grade: 'A+', completed: true, major: 'software' },
  { id: 'sw-r02', name: '알고리즘', category: '전공필수', credits: 3, grade: 'A0', completed: true, major: 'software' },
  { id: 'sw-r03', name: '운영체제', category: '전공필수', credits: 3, grade: 'B+', completed: true, major: 'software' },
  { id: 'sw-r04', name: '컴퓨터네트워크', category: '전공필수', credits: 3, grade: 'B0', completed: true, major: 'software' },
  { id: 'sw-r05', name: '데이터베이스', category: '전공필수', credits: 3, grade: 'A+', completed: true, major: 'software' },
  { id: 'sw-r06', name: '소프트웨어공학', category: '전공필수', credits: 3, grade: 'A0', completed: true, major: 'software' },
  { id: 'sw-r07', name: '컴퓨터구조', category: '전공필수', credits: 3, grade: 'B+', completed: true, major: 'software' },
  { id: 'sw-r08', name: '객체지향프로그래밍', category: '전공필수', credits: 3, grade: 'A0', completed: true, major: 'software' },
  { id: 'sw-r09', name: '웹프로그래밍', category: '전공필수', credits: 3, grade: null, completed: false, major: 'software' },
  { id: 'sw-r10', name: '모바일앱개발', category: '전공필수', credits: 3, grade: null, completed: false, major: 'software' },
  // 전공선택 (15/30학점 이수)
  { id: 'sw-e01', name: '인공지능', category: '전공선택', credits: 3, grade: 'A+', completed: true, major: 'software' },
  { id: 'sw-e02', name: '머신러닝', category: '전공선택', credits: 3, grade: 'A0', completed: true, major: 'software' },
  { id: 'sw-e03', name: '컴퓨터비전', category: '전공선택', credits: 3, grade: 'B+', completed: true, major: 'software' },
  { id: 'sw-e04', name: '자연어처리', category: '전공선택', credits: 3, grade: 'B0', completed: true, major: 'software' },
  { id: 'sw-e05', name: '클라우드컴퓨팅', category: '전공선택', credits: 3, grade: 'A0', completed: true, major: 'software' },
  { id: 'sw-e06', name: '딥러닝', category: '전공선택', credits: 3, grade: null, completed: false, major: 'software' },
  { id: 'sw-e07', name: '분산시스템', category: '전공선택', credits: 3, grade: null, completed: false, major: 'software' },
  { id: 'sw-e08', name: '정보보안', category: '전공선택', credits: 3, grade: null, completed: false, major: 'software' },
  { id: 'sw-e09', name: '블록체인', category: '전공선택', credits: 3, grade: null, completed: false, major: 'software' },
  { id: 'sw-e10', name: '임베디드시스템', category: '전공선택', credits: 3, grade: null, completed: false, major: 'software' },

  // ── 시스템생명공학 ─────────────────────────────────────────────────────────
  // 전공기초 (9/9학점 이수)
  { id: 'bt-f01', name: '일반생물학', category: '전공기초', credits: 3, grade: 'A0', completed: true, major: 'biotech' },
  { id: 'bt-f02', name: '일반화학', category: '전공기초', credits: 3, grade: 'B+', completed: true, major: 'biotech' },
  { id: 'bt-f03', name: '생화학기초', category: '전공기초', credits: 3, grade: 'B0', completed: true, major: 'biotech' },
  // 전공필수 (12/18학점 이수)
  { id: 'bt-r01', name: '유전공학', category: '전공필수', credits: 3, grade: 'A+', completed: true, major: 'biotech' },
  { id: 'bt-r02', name: '세포생물학', category: '전공필수', credits: 3, grade: 'A0', completed: true, major: 'biotech' },
  { id: 'bt-r03', name: '분자생물학', category: '전공필수', credits: 3, grade: 'B+', completed: true, major: 'biotech' },
  { id: 'bt-r04', name: '생물정보학', category: '전공필수', credits: 3, grade: 'B0', completed: true, major: 'biotech' },
  { id: 'bt-r05', name: '대사공학', category: '전공필수', credits: 3, grade: null, completed: false, major: 'biotech' },
  { id: 'bt-r06', name: '생화학', category: '전공필수', credits: 3, grade: null, completed: false, major: 'biotech' },
  // 전공선택 (6/9학점 이수)
  { id: 'bt-e01', name: '단백질공학', category: '전공선택', credits: 3, grade: 'B+', completed: true, major: 'biotech' },
  { id: 'bt-e02', name: '합성생물학', category: '전공선택', credits: 3, grade: 'A0', completed: true, major: 'biotech' },
  { id: 'bt-e03', name: '시스템생물학', category: '전공선택', credits: 3, grade: null, completed: false, major: 'biotech' },

  // ── 교양 ──────────────────────────────────────────────────────────────────
  // 교양필수 (16/18학점 이수)
  { id: 'lib-r01', name: '영어커뮤니케이션1', category: '교양필수', credits: 2, grade: 'A+', completed: true, major: 'liberal' },
  { id: 'lib-r02', name: '영어커뮤니케이션2', category: '교양필수', credits: 2, grade: 'A0', completed: true, major: 'liberal' },
  { id: 'lib-r03', name: '글쓰기', category: '교양필수', credits: 2, grade: 'B+', completed: true, major: 'liberal' },
  { id: 'lib-r04', name: '창의적사고와표현', category: '교양필수', credits: 2, grade: 'A0', completed: true, major: 'liberal' },
  { id: 'lib-r05', name: '체육1', category: '교양필수', credits: 1, grade: 'P', completed: true, major: 'liberal' },
  { id: 'lib-r06', name: '체육2', category: '교양필수', credits: 1, grade: 'P', completed: true, major: 'liberal' },
  { id: 'lib-r07', name: '미적분학', category: '교양필수', credits: 3, grade: 'B+', completed: true, major: 'liberal' },
  { id: 'lib-r08', name: '사회봉사', category: '교양필수', credits: 2, grade: 'P', completed: true, major: 'liberal' },
  { id: 'lib-r09', name: '리더십과팀워크', category: '교양필수', credits: 2, grade: null, completed: false, major: 'liberal' },
  // 교양선택 (11/14학점 이수)
  { id: 'lib-e01', name: '철학의이해', category: '교양선택', credits: 2, grade: 'A0', completed: true, major: 'liberal' },
  { id: 'lib-e02', name: '경제학원론', category: '교양선택', credits: 3, grade: 'B+', completed: true, major: 'liberal' },
  { id: 'lib-e03', name: '심리학개론', category: '교양선택', credits: 2, grade: 'A0', completed: true, major: 'liberal' },
  { id: 'lib-e04', name: '문화예술의이해', category: '교양선택', credits: 2, grade: 'B0', completed: true, major: 'liberal' },
  { id: 'lib-e05', name: '사회학개론', category: '교양선택', credits: 3, grade: null, completed: false, major: 'liberal' },
];

// ─── 전공별 통계 ─────────────────────────────────────────────────────────────
export const MAJOR_STATS: MajorStats[] = [
  {
    key: 'software',
    name: '소프트웨어학부',
    type: '주전공',
    completed: 51,
    required: 72,
    categories: [
      { name: '전공기초', completed: 12, required: 12 },
      { name: '전공필수', completed: 24, required: 30 },
      { name: '전공선택', completed: 15, required: 30 },
    ],
  },
  {
    key: 'biotech',
    name: '시스템생명공학',
    type: '복수전공',
    completed: 27,
    required: 36,
    categories: [
      { name: '전공기초', completed: 9, required: 9 },
      { name: '전공필수', completed: 12, required: 18 },
      { name: '전공선택', completed: 6, required: 9 },
    ],
  },
];

export const OVERALL_STATS = {
  completed: 105,
  required: 140,
  liberal: { completed: 27, required: 32 },
};
