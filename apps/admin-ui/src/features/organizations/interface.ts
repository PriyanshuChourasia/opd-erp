export interface Organization {
  id: string;
  name: string;
  legal_name: string | null;
  registration_number: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  timezone: string | null;
  locale: string | null;
  currency: string | null;
  status: string | null;
  createdAt: string | null;
}

export interface OrganizationInput {
  name: string;
  legal_name?: string | null;
  registration_number?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  timezone?: string | null;
  locale?: string | null;
  currency?: string | null;
  status?: string;
}
