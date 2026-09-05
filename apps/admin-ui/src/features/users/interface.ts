export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string | null;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  avatar_url: string | null;
  status: string | null;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UserInput {
  name: string;
  email: string;
  password?: string;
  phone?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  avatar_url?: string | null;
  status?: string | null;
}