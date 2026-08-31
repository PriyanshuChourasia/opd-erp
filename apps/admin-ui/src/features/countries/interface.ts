export interface Country {
  id: string;
  name: string;
  code: string | null;
  phone_code: string | null;
  status: string | null;
  created_at: string | null;
}

export interface CountryInput {
  name: string;
  code: string;
  phone_code?: string | null;
  status?: string;
}