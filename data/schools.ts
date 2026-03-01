import type { School } from '@/types';

export const SCHOOLS: School[] = [
  {
    value: 'cau',
    label: '중앙대학교',
    departments: [
      { value: 'cau-software', label: '소프트웨어학부' },
      { value: 'cau-systems', label: '시스템공학과' },
    ],
  },
  {
    value: 'snu',
    label: '서울대학교',
    departments: [
      { value: 'snu-cse', label: '컴퓨터공학과' },
    ],
  },
  {
    value: 'kku',
    label: '건국대학교',
    departments: [
      { value: 'kku-ee', label: '전자전기공학과' },
      { value: 'kku-chem', label: '화학과' },
    ],
  },
  {
    value: 'uos',
    label: '서울시립대',
    departments: [
      { value: 'uos-gis', label: '공간정보학과' },
    ],
  },
];

export const SCHOOL_SELECT_DATA = SCHOOLS.map(({ value, label }) => ({
  value,
  label,
}));
