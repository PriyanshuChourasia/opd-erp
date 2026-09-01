export interface Customer {
  id: string;
  first_name: string;
  last_name: string | null;
  company_name: string | null;
  tax_number: string | null;
  email: string;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  billing_address: string | null;
  billing_city: string | null;
  billing_state: string | null;
  billing_country: string | null;
  billing_pincode: string | null;
  status: string | null;
  user_id: number | null;
  created_at: string | null;
}

export interface CustomerInput {
  first_name: string;
  last_name?: string | null;
  company_name?: string | null;
  tax_number?: string | null;
  email: string;
  phone?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  billing_address?: string | null;
  billing_city?: string | null;
  billing_state?: string | null;
  billing_country?: string | null;
  billing_pincode?: string | null;
  status?: string;
  user_id?: number | null;
}