import { apiFetch, type Role, type Permission } from "@/lib/api";
import type { CreateRoleInput } from "./interface";

export async function fetchRoles(): Promise<Role[]> {
  return apiFetch<Role[]>("/roles");
}

export async function fetchRole(id: string): Promise<Role> {
  return apiFetch<Role>(`/roles/${id}`);
}

export async function createRole(data: CreateRoleInput): Promise<Role> {
  return apiFetch<Role>("/roles", { method: "POST", body: JSON.stringify(data) });
}

export async function updateRole(id: string, data: Partial<CreateRoleInput>): Promise<Role> {
  return apiFetch<Role>(`/roles/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteRole(id: string): Promise<void> {
  return apiFetch<void>(`/roles/${id}`, { method: "DELETE" });
}

export async function fetchPermissions(): Promise<Permission[]> {
  return apiFetch<Permission[]>("/permissions");
}

export async function createPermission(data: { resource: string; action: string; name: string }): Promise<Permission> {
  return apiFetch<Permission>("/permissions", { method: "POST", body: JSON.stringify(data) });
}

export async function deletePermission(id: string): Promise<void> {
  return apiFetch<void>(`/permissions/${id}`, { method: "DELETE" });
}
