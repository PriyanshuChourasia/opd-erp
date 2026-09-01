export interface LicenseCustomerRef {
  id: string;
  name: string;
}

export interface LicenseOrganizationRef {
  id: string;
  name: string;
}

export interface License {
  id: string;
  license_number: string;
  customer_id: string | null;
  customer: LicenseCustomerRef | null;
  organization_id: string | null;
  organization: LicenseOrganizationRef | null;
  status: string;
  issue_date: string | null;
  start_date: string | null;
  expiry_date: string | null;
  plan: string | null;
  max_users: number | null;
  max_devices: number | null;
  features: string[] | null;
  created_at: string | null;
}

export interface LicenseInput {
  customer_id: number;
  organization_id?: number | null;
  status?: string;
  issue_date?: string | null;
  start_date?: string | null;
  expiry_date?: string | null;
  plan?: string | null;
  max_users?: number | null;
  max_devices?: number | null;
  features?: string[] | null;
}
