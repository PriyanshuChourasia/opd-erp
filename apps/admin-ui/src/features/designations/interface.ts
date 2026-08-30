export interface Designation {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  department_id: number;
  created_at: string | null;
}

export interface DesignationInput {
  name: string;
  description?: string | null;
  status?: string;
  department_id: number;
}