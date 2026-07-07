import type { AuthUser } from "@/store/auth-slice";
import { apiClient, toApiError, extractApiError } from "./axios-client";

export { ApiError } from "./axios-client";
export { extractApiError, toApiError };

/**
 * Drop-in replacement for the old `apiFetch` that used the native `fetch` API.
 * Uses the axios client internally so that interceptors (JWT, retry, 401
 * redirect) are applied consistently.
 */
/**
 * Legacy fetch-style API helper.
 *
 * Kept for backward compatibility — used by the auth module (login, register).
 * Internally delegates to the axios client so retry, JWT injection, and 401
 * handling are applied consistently.
 *
 * The `method` parameter is narrowed to the four HTTP verbs actually used by
 * this app. If a non-standard method is passed, the axios request will still
 * work (axios doesn't validate the method string).
 */
export async function apiFetch<T>(
  path: string,
  init?: { method?: string; body?: string; headers?: Record<string, string> },
): Promise<T> {
  try {
    const method = (init?.method ?? "GET").toUpperCase() as
      | "GET"
      | "POST"
      | "PATCH"
      | "DELETE";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...init?.headers,
    };

    const res = await apiClient.request<T>({
      method,
      url: path,
      data: init?.body ? JSON.parse(init.body) : undefined,
      headers,
    });
    return res.data;
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * Typed request helper used by all domain API functions below.
 * Wraps axios calls so errors are always thrown as `ApiError` instances
 * containing the HTTP status and a human-readable message.
 */
async function request<T>(config: {
  method: "GET" | "POST" | "PATCH" | "DELETE";
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

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  allergies: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientInput {
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  emergencyContact?: string;
  allergies?: string[];
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  specialization?: string | null;
  licenseNumber: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDoctorInput {
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  licenseNumber: string;
}

export interface QueueEntry {
  id: string;
  tokenNumber: number;
  patientId: string;
  doctorId: string;
  status: string;
  queueDate: string;
  checkedInAt: string | null;
  createdAt: string;
  patient: Patient;
  doctor: Doctor;
}

export interface CreateQueueEntryInput {
  patientId: string;
  doctorId: string;
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  maxPatients: number;
}

export interface UpsertDoctorScheduleInput {
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration?: number;
  maxPatients?: number;
}

export interface DoctorSlot {
  time: string;
  capacity: number;
  booked: number;
  available: boolean;
}

export interface DoctorSlots {
  available: boolean;
  slots: DoctorSlot[];
}

export type AppointmentType =
  | "WALK_IN"
  | "CONSULTATION"
  | "SPECIALIST"
  | "EMERGENCY"
  | "FOLLOW_UP"
  | "TELECONSULTATION";

export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  type: string;
  status: string;
  tokenNumber: number | null;
  fee: number;
  notes: string | null;
  patient: Patient;
  doctor: Doctor;
}

export interface CreateAppointmentInput {
  patientId: string;
  doctorId: string;
  date: string;
  type: AppointmentType;
  fee: number;
  notes?: string;
}

export interface MedicineCatalogItem {
  id: string;
  brandName: string;
  genericName: string;
  strength?: string | null;
  form?: string | null;
}

export interface BillItemInput {
  itemType: string;
  itemId?: string;
  itemName: string;
  quantity?: number;
  unitPrice: number;
}

export interface CreateBillInput {
  patientId?: string | null;
  paymentMethod?: "CASH" | "CARD" | "UPI";
  notes?: string;
  discount?: number;
  tax?: number;
  items: BillItemInput[];
}

export interface BillItem {
  id: string;
  billId: string;
  itemType: string;
  itemId: string | null;
  itemName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  createdAt: string;
}

export type BillStatus = "PENDING" | "PAID" | "PARTIAL" | "REFUNDED" | "CANCELLED";

export interface Bill {
  id: string;
  patientId: string | null;
  invoiceNo: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  patient: Patient | null;
  items: BillItem[];
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

// ─── Patient API ──────────────────────────────────────────────

export function fetchPatients(search?: string) {
  return request<Patient[]>({
    method: "GET",
    path: "/patients",
    params: { search },
  });
}

export function fetchPatient(id: string) {
  return request<Patient>({ method: "GET", path: `/patients/${id}` });
}

export function createPatient(input: CreatePatientInput) {
  return request<Patient>({
    method: "POST",
    path: "/patients",
    body: input,
  });
}

export function updatePatient(id: string, input: Partial<CreatePatientInput>) {
  return request<Patient>({
    method: "PATCH",
    path: `/patients/${id}`,
    body: input,
  });
}

export function deletePatient(id: string) {
  return request<void>({ method: "DELETE", path: `/patients/${id}` });
}

// ─── Doctor API ───────────────────────────────────────────────

export function fetchDoctors(search?: string) {
  return request<Doctor[]>({
    method: "GET",
    path: "/doctors",
    params: { search },
  });
}

export function fetchDoctor(id: string) {
  return request<Doctor>({ method: "GET", path: `/doctors/${id}` });
}

export function createDoctor(input: CreateDoctorInput) {
  return request<Doctor>({
    method: "POST",
    path: "/doctors",
    body: input,
  });
}

export function updateDoctor(id: string, input: Partial<CreateDoctorInput>) {
  return request<Doctor>({
    method: "PATCH",
    path: `/doctors/${id}`,
    body: input,
  });
}

export function deleteDoctor(id: string) {
  return request<void>({ method: "DELETE", path: `/doctors/${id}` });
}

// ─── Queue API ────────────────────────────────────────────────

export function fetchQueue(doctorId?: string, date?: string) {
  return request<QueueEntry[]>({
    method: "GET",
    path: "/queue",
    params: { doctorId, date },
  });
}

export function createQueueEntry(input: CreateQueueEntryInput) {
  return request<QueueEntry>({
    method: "POST",
    path: "/queue",
    body: input,
  });
}

export function updateQueueStatus(id: string, status: string) {
  return request<QueueEntry>({
    method: "PATCH",
    path: `/queue/${id}/status`,
    body: { status },
  });
}

export function deleteQueueEntry(id: string) {
  return request<void>({ method: "DELETE", path: `/queue/${id}` });
}

// ─── Doctor Schedule API ──────────────────────────────────────

export function fetchDoctorSchedules(doctorId: string) {
  return request<DoctorSchedule[]>({
    method: "GET",
    path: "/doctor-schedules",
    params: { doctorId },
  });
}

export function upsertDoctorSchedule(input: UpsertDoctorScheduleInput) {
  return request<DoctorSchedule>({
    method: "POST",
    path: "/doctor-schedules",
    body: input,
  });
}

export function deleteDoctorSchedule(id: string) {
  return request<void>({
    method: "DELETE",
    path: `/doctor-schedules/${id}`,
  });
}

export function fetchDoctorSlots(doctorId: string, date: string) {
  return request<DoctorSlots>({
    method: "GET",
    path: "/doctor-schedules/slots",
    params: { doctorId, date },
  });
}

// ─── Appointment API ──────────────────────────────────────────

export function fetchAppointments(filters: {
  doctorId?: string;
  date?: string;
  status?: string;
  patientId?: string;
} = {}) {
  return request<Appointment[]>({
    method: "GET",
    path: "/appointments",
    params: filters,
  });
}

export function createAppointment(input: CreateAppointmentInput) {
  return request<Appointment>({
    method: "POST",
    path: "/appointments",
    body: input,
  });
}

export function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  return request<Appointment>({
    method: "PATCH",
    path: `/appointments/${id}/status`,
    body: { status },
  });
}

export function deleteAppointment(id: string) {
  return request<void>({
    method: "DELETE",
    path: `/appointments/${id}`,
  });
}

// ─── Role & Permission API ────────────────────────────────────

export function fetchRoles() {
  return request<Role[]>({ method: "GET", path: "/roles" });
}

export function fetchRole(id: string) {
  return request<Role>({ method: "GET", path: `/roles/${id}` });
}

export function createRole(input: CreateRoleInput) {
  return request<Role>({
    method: "POST",
    path: "/roles",
    body: input,
  });
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

export function fetchPermissions() {
  return request<Permission[]>({ method: "GET", path: "/permissions" });
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

// ─── Billing API ──────────────────────────────────────────────

export function fetchBills(patientId?: string) {
  return request<Bill[]>({
    method: "GET",
    path: "/billing",
    params: { patientId },
  });
}

export function fetchBill(id: string) {
  return request<Bill>({ method: "GET", path: `/billing/${id}` });
}

export function updateBillStatus(id: string, status: BillStatus) {
  return request<Bill>({
    method: "PATCH",
    path: `/billing/${id}/status`,
    body: { status },
  });
}

// ─── Search helpers ───────────────────────────────────────────

export function searchPatients(query: string) {
  return request<Patient[]>({
    method: "GET",
    path: "/patients",
    params: { search: query },
  });
}

export function searchMedicines(query: string) {
  return request<MedicineCatalogItem[]>({
    method: "GET",
    path: "/medicine-catalog",
    params: { search: query },
  });
}

export function createBill(payload: CreateBillInput) {
  return request<Bill>({
    method: "POST",
    path: "/billing",
    body: payload,
  });
}

// ─── Profile API ─────────────────────────────────────────────

export function fetchProfile() {
  return request<AuthUser>({ method: "GET", path: "/auth/me" });
}

export function updateProfile(data: { name?: string; email?: string }) {
  return request<AuthUser>({
    method: "PATCH",
    path: "/auth/me",
    body: data,
  });
}

export function changePassword(data: { currentPassword: string; newPassword: string }) {
  return request<{ message: string }>({
    method: "POST",
    path: "/auth/change-password",
    body: data,
  });
}
