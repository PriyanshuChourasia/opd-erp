import {
  apiClient,
  toApiError,
  extractApiError,
} from "./axios-client";

export { ApiError } from "./axios-client";
export { extractApiError, toApiError };

/**
 * Typed request helper used by all domain API functions below.
 * Wraps axios calls so errors are always thrown as `ApiError` instances
 * containing the HTTP status and a human-readable message.
 */
async function request<T>(config: {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  params?: Record<string, string | undefined>;
  body?: unknown;
}): Promise<T> {
  try {
    const params = new URLSearchParams();
    if (config.params) {
      for (const [key, value] of Object.entries(config.params)) {
        if (value !== undefined && value !== "") {
          params.set(key, value);
        }
      }
    }
    const qs = params.toString();
    const url = qs ? `${config.path}?${qs}` : config.path;

    const res = await apiClient.request<T>({
      method: config.method,
      url,
      data: config.body,
    });

    return res.data;
  } catch (error) {
    throw toApiError(error);
  }
}

// ─── Types ────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface AuthUser {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email: string;
  mobileNumber?: string | null;
  roleName: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface Organisation {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  registrationNumber?: string | null;
  registrationFee: number;
  discountEnabled: boolean;
  maxDiscountPercent: number;
  defaultDiscountType: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrganisationInput {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  registrationNumber?: string;
  registrationFee?: number;
  discountEnabled?: boolean;
  maxDiscountPercent?: number;
  defaultDiscountType?: string;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  name: string;
  createdAt: string;
}

export interface CreatePermissionInput {
  resource: string;
  action: string;
  name: string;
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
  permission: Permission;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { users: number };
  rolePermissions: RolePermission[];
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface User {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email: string;
  mobileNumber?: string | null;
  countryCode: string;
  gender?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role: { name: string };
}

export interface CreateUserInput {
  username: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  mobileNumber?: string;
  countryCode?: string;
  gender?: string;
  dateOfBirth?: string;
  profilePhotoUrl?: string;
  qualification?: string;
  password: string;
  roleId: string;
}

export interface UpdateUserInput {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  mobileNumber?: string;
  countryCode?: string;
  gender?: string;
  dateOfBirth?: string;
  profilePhotoUrl?: string;
  qualification?: string;
  password?: string;
  roleId?: string;
}

export interface RoleOption {
  id: string;
  name: string;
  description: string | null;
}

// ─── Auth API ─────────────────────────────────────────────────

export async function loginApi(
  credential: string,
  password: string,
): Promise<LoginResponse> {
  const isEmail = credential.includes("@");
  return request<LoginResponse>({
    method: "POST",
    path: "/auth/login",
    body: isEmail
      ? { email: credential, password }
      : { username: credential, password },
  });
}

export function fetchProfile() {
  return request<AuthUser>({ method: "GET", path: "/auth/me" });
}

export function updateProfile(data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobileNumber?: string;
  gender?: string;
  dateOfBirth?: string;
  profilePhotoUrl?: string;
  qualification?: string;
}) {
  return request<AuthUser>({
    method: "PATCH",
    path: "/auth/me",
    body: data,
  });
}

export function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  return request<{ message: string }>({
    method: "POST",
    path: "/auth/change-password",
    body: data,
  });
}

// ─── Organisation API ─────────────────────────────────────────

export function fetchOrganisation() {
  return request<Organisation | null>({ method: "GET", path: "/organisation" });
}

export function updateOrganisation(data: UpdateOrganisationInput) {
  return request<Organisation>({
    method: "PATCH",
    path: "/organisation",
    body: data,
  });
}

// ─── Role & Permission API ────────────────────────────────────

export function fetchRoles(params: PaginationParams = {}) {
  return request<PaginatedResult<Role>>({
    method: "GET",
    path: "/roles",
    params: {
      page: params.page !== undefined ? String(params.page) : undefined,
      limit: params.limit !== undefined ? String(params.limit) : undefined,
    },
  });
}

export function fetchRole(id: string) {
  return request<Role>({ method: "GET", path: `/roles/${id}` });
}

export function createRole(input: CreateRoleInput) {
  return request<Role>({ method: "POST", path: "/roles", body: input });
}

export function updateRole(id: string, input: Partial<CreateRoleInput>) {
  return request<Role>({
    method: "PATCH",
    path: `/roles/${id}`,
    body: input,
  });
}

export function deleteRole(id: string) {
  return request<void>({ method: "DELETE", path: `/roles/${id}` });
}

export interface RoleUser {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email: string;
  mobileNumber?: string | null;
  isActive: boolean;
  createdAt: string;
}

export function fetchUsersByRole(roleId: string) {
  return request<RoleUser[]>({
    method: "GET",
    path: `/roles/${roleId}/users`,
  });
}

export function fetchPermissions(params: PaginationParams = {}) {
  return request<PaginatedResult<Permission>>({
    method: "GET",
    path: "/permissions",
    params: {
      page: params.page !== undefined ? String(params.page) : undefined,
      limit: params.limit !== undefined ? String(params.limit) : undefined,
    },
  });
}

export function createPermission(input: CreatePermissionInput) {
  return request<Permission>({
    method: "POST",
    path: "/permissions",
    body: input,
  });
}

export function deletePermission(id: string) {
  return request<void>({ method: "DELETE", path: `/permissions/${id}` });
}

// ─── Users API ────────────────────────────────────────────────

export function fetchUsers(
  params: { search?: string; isActive?: string } & PaginationParams = {},
) {
  return request<PaginatedResult<User>>({
    method: "GET",
    path: "/users",
    params: {
      search: params.search,
      isActive: params.isActive,
      page: params.page !== undefined ? String(params.page) : undefined,
      limit: params.limit !== undefined ? String(params.limit) : undefined,
    },
  });
}

export function fetchUser(id: string) {
  return request<User & { roleId: string; username: string }>({
    method: "GET",
    path: `/users/${id}`,
  });
}

export function fetchUserRoles() {
  return request<RoleOption[]>({ method: "GET", path: "/users/roles" });
}

export function createUser(input: CreateUserInput) {
  return request<User>({ method: "POST", path: "/users", body: input });
}

export function updateUser(id: string, input: UpdateUserInput) {
  return request<User>({
    method: "PATCH",
    path: `/users/${id}`,
    body: input,
  });
}

/** Soft-delete a user by setting isActive=false */
export function deleteUser(id: string) {
  return request<User>({ method: "DELETE", path: `/users/${id}` });
}

/** Restore a previously soft-deleted user */
export function restoreUser(id: string) {
  return request<User>({
    method: "PATCH",
    path: `/users/${id}/restore`,
  });
}

// ─── Module Registry API ─────────────────────────────────────

export interface ModuleAction {
  id: string;
  name: string;
  description: string;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path?: string;
  request?: string;
  response?: string;
}

export interface ModuleCapability {
  id: string;
  name: string;
  description: string;
  actions: ModuleAction[];
}

export interface ModuleFeature {
  id: string;
  name: string;
  description: string;
  capabilities: ModuleCapability[];
}

export interface ModuleDependency {
  name: string;
  version?: string;
  optional?: boolean;
}

export interface AppModule {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  features: ModuleFeature[];
  dependencies?: ModuleDependency[];
  routePrefix?: string;
  enabled?: boolean;
}

export function fetchModules() {
  return request<{ data: AppModule[]; total: number }>({
    method: "GET",
    path: "/modules",
  });
}

export function fetchModule(id: string) {
  return request<{ data: AppModule }>({
    method: "GET",
    path: `/modules/${id}`,
  });
}

// ─── Sidebar Config API ──────────────────────────────────────

export interface SidebarMenuItem {
  id: string;
  label: string;
  path: string;
  icon?: string | null;
  group: string;
  sortOrder: number;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
  roleMenus: {
    roleId: string;
    sidebarMenuId: string;
    role: { id: string; name: string };
  }[];
}

export function fetchSidebarConfig() {
  return request<SidebarMenuItem[]>({
    method: "GET",
    path: "/sidebar-config",
  });
}

/** Fetch sidebar menu items for the currently authenticated user. */
export function fetchMySidebarConfig() {
  return request<SidebarMenuItem[]>({
    method: "GET",
    path: "/sidebar-config/my",
  });
}

/** All known sidebar menu paths — used by the route guard. */
export function fetchAllSidebarPaths() {
  return request<{ path: string }[]>({
    method: "GET",
    path: "/sidebar-config/all-paths",
  });
}

export function fetchSidebarConfigForRole(roleId: string) {
  return request<SidebarMenuItem[]>({
    method: "GET",
    path: `/sidebar-config/for-role/${roleId}`,
  });
}

export function createSidebarMenuItem(data: {
  label: string;
  path: string;
  icon?: string;
  group: string;
  sortOrder?: number;
  isHidden?: boolean;
  roleIds?: string[];
}) {
  return request<SidebarMenuItem>({
    method: "POST",
    path: "/sidebar-config",
    body: data,
  });
}

export function updateSidebarMenuItem(
  id: string,
  data: {
    label?: string;
    path?: string;
    icon?: string;
    group?: string;
    sortOrder?: number;
    isHidden?: boolean;
    roleIds?: string[];
  },
) {
  return request<SidebarMenuItem>({
    method: "PATCH",
    path: `/sidebar-config/${id}`,
    body: data,
  });
}

export function deleteSidebarMenuItem(id: string) {
  return request<void>({
    method: "DELETE",
    path: `/sidebar-config/${id}`,
  });
}

export function assignRolesToMenuItem(id: string, roleIds: string[]) {
  return request<SidebarMenuItem>({
    method: "PATCH",
    path: `/sidebar-config/${id}/assign-roles`,
    body: { roleIds },
  });
}
