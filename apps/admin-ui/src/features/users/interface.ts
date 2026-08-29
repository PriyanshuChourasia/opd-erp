export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string | null;
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
}