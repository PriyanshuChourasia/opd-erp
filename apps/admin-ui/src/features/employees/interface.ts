export interface Employee {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string | null;
  gender: string | null;
  date_of_joining: string | null;
  status: string | null;
  department_id: number;
  designation_id: number;
  user_id: number | null;
  created_at: string | null;
}

export interface EmployeeInput {
  first_name: string;
  last_name?: string | null;
  email: string;
  phone?: string | null;
  gender?: string | null;
  date_of_joining?: string | null;
  status?: string;
  department_id: number;
  designation_id: number;
  user_id?: number | null;
}