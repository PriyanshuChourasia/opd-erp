import { apiClient } from "@/lib/api-client";

export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  country_id?: number;
  organization_id?: number;
  status?: string;
}

export interface CrudApi<T extends { id: string | number }, TInput> {
  list: (params: ListParams) => Promise<Paginated<T>>;
  show: (id: string | number) => Promise<T>;
  create: (input: TInput) => Promise<T>;
  update: (id: string | number, input: Partial<TInput>) => Promise<T>;
  remove: (id: string | number) => Promise<void>;
}

export function createCrudApi<T extends { id: string | number }, TInput>(
  path: string,
): CrudApi<T, TInput> {
  return {
    async list(params: ListParams): Promise<Paginated<T>> {
      const response = await apiClient.get<Paginated<T>>(`/${path}`, { params });
      return response.data;
    },
    async show(id: string | number): Promise<T> {
      const response = await apiClient.get<T>(`/${path}/${id}`);
      return response.data;
    },
    async create(input: TInput): Promise<T> {
      const response = await apiClient.post<T>(`/${path}`, input);
      return response.data;
    },
    async update(id: string | number, input: Partial<TInput>): Promise<T> {
      const response = await apiClient.put<T>(`/${path}/${id}`, input);
      return response.data;
    },
    async remove(id: string | number): Promise<void> {
      await apiClient.delete(`/${path}/${id}`);
    },
  };
}