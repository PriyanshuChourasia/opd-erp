import { apiClient } from "@/lib/api-client";

import type { Paginated, User, UserInput } from "./interface";

export async function listUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<Paginated<User>> {
  const response = await apiClient.get<Paginated<User>>("/users", { params });
  return response.data;
}

export async function createUser(input: UserInput): Promise<User> {
  const response = await apiClient.post<User>("/users", input);
  return response.data;
}

export async function updateUser(
  id: string,
  input: Partial<UserInput>,
): Promise<User> {
  const response = await apiClient.put<User>(`/users/${id}`, input);
  return response.data;
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}