export interface Customer {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  status: string | null;
  user_id: number | null;
  created_at: string | null;
}

export interface CustomerInput {
  first_name: string;
  last_name?: string | null;
  email: string;
  phone?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  status?: string;
  user_id?: number | null;
}