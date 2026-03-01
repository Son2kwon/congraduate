export type MajorKey = 'software' | 'biotech' | 'liberal';

export type CourseCategory =
  | '전공기초'
  | '전공필수'
  | '전공선택'
  | '교양필수'
  | '교양선택';

export interface Course {
  id: string;
  name: string;
  category: CourseCategory;
  credits: number;
  grade: string | null;
  completed: boolean;
  major: MajorKey;
}

export interface CategoryStats {
  name: string;
  completed: number;
  required: number;
}

export interface MajorStats {
  key: MajorKey;
  name: string;
  type: '주전공' | '복수전공' | '교양';
  completed: number;
  required: number;
  categories: CategoryStats[];
}
