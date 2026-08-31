export interface State {
  id: string;
  name: string;
  code: string | null;
  country_id: number;
  status: string | null;
  created_at: string | null;
}

export interface StateInput {
  name: string;
  code?: string | null;
  country_id: number;
  status?: string;
}