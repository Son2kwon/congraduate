export interface Department {
  value: string;
  label: string;
}

export interface School {
  value: string;
  label: string;
  departments: Department[];
}
