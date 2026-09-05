export interface Department {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  status: string | null;
  created_at: string | null;
}

export interface DepartmentInput {
  name: string;
  code?: string | null;
  description?: string | null;
  status?: string;
}