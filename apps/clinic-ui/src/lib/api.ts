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
  qualification?: string | null;
  specialization?: string | null;
  medicalRegistrationNo: string;
  medicalCouncil?: string | null;
  registrationYear?: number | null;
  yearsOfExperience?: number | null;
  consultationFee: number;
  consultationMode: string;
  signature?: string | null;
  registrationCertificateUrl?: string | null;
  degreeCertificateUrl?: string | null;
  governmentIdUrl?: string | null;
  verificationStatus: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDoctorInput {
  qualification?: string;
  specialization?: string;
  medicalRegistrationNo: string;
  medicalCouncil?: string;
  registrationYear?: number;
  yearsOfExperience?: number;
  consultationFee?: number;
  consultationMode?: string;
  signature?: string;
  registrationCertificateUrl?: string;
  degreeCertificateUrl?: string;
  governmentIdUrl?: string;
  verificationStatus?: string;
}

/**
 * Unified input for creating a Doctor together with its User account
 * and an optional Address in a single API call.
 */
export interface CreateDoctorWithUserInput {
  // User account
  username: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  mobileNumber?: string;
  password: string;

  // Doctor professional
  qualification?: string;
  specialization?: string;
  medicalRegistrationNo: string;
  medicalCouncil?: string;
  registrationYear?: number;
  yearsOfExperience?: number;
  consultationFee?: number;
  consultationMode?: string;
  signature?: string;
  registrationCertificateUrl?: string;
  degreeCertificateUrl?: string;
  governmentIdUrl?: string;
  verificationStatus?: string;

  // Address (optional)
  addressType?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface DoctorWithUserResult {
  doctor: Doctor;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    mobileNumber: string | null;
    roleName: string;
    userableType: string;
    userableId: string;
  };
  address: Address | null;
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

export interface EmployeeSchedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  shiftId?: string | null;
  employeeSchedulableType: string;
  employeeSchedulableId: string;
  createdAt: string;
  updatedAt: string;
  shift?: Shift | null;
}

export interface CreateEmployeeScheduleInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  shiftId?: string;
  employeeSchedulableType: string;
  employeeSchedulableId: string;
}

export interface Shift {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
  isOvernight: boolean;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface Medicine {
  id: string;
  name: string;
  genericName?: string | null;
  brandName?: string | null;
  category?: string | null;
  strength?: string | null;
  unit: string;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionItem {
  id: string;
  prescriptionId: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  duration?: string | null;
  instructions?: string | null;
  quantity: number;
  refills: number;
  createdAt: string;
}

export type PrescriptionStatus = "ACTIVE" | "DISPENSED" | "CANCELLED";

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  diagnosis?: string | null;
  notes?: string | null;
  status: PrescriptionStatus;
  createdAt: string;
  updatedAt: string;
  patient: Patient;
  doctor: Doctor;
  items: PrescriptionItem[];
}

export interface DispensingPrescription {
  id: string;
  patientId: string;
  doctorId: string;
  diagnosis?: string | null;
  notes?: string | null;
  status: PrescriptionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Dispensing {
  id: string;
  prescriptionId: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  batchNo?: string | null;
  expiryDate?: string | null;
  notes?: string | null;
  dispensedAt: string;
  dispensedBy?: string | null;
  prescription: DispensingPrescription;
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

export interface Organisation {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  registrationNumber?: string | null;
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
}

// ─── Address Types ────────────────────────────────────────────

export interface Address {
  id: string;
  addressType: string;
  addressLine1: string;
  addressLine2?: string | null;
  landmark?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  country: string;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isPrimary: boolean;
  isActive: boolean;
  addressableType: string;
  addressableId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressInput {
  addressType: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  isPrimary?: boolean;
  addressableType: string;
  addressableId: string;
}

export interface UpdateAddressInput {
  addressType?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  isPrimary?: boolean;
}

export const ADDRESS_TYPES = ['CLINIC', 'HOME', 'BILLING', 'OTHER'] as const;
export type AddressType = (typeof ADDRESS_TYPES)[number];

// ─── Address API ──────────────────────────────────────────────

export function fetchAddresses(params: { addressType?: string; addressableType?: string; addressableId?: string } & PaginationParams = {}) {
  return request<PaginatedResult<Address>>({
    method: "GET",
    path: "/addresses",
    params: {
      addressableType: params.addressableType,
      addressableId: params.addressableId,
      page: params.page !== undefined ? String(params.page) : undefined,
      limit: params.limit !== undefined ? String(params.limit) : undefined,
    },
  });
}

export function fetchEntityAddresses(addressableType: string, addressableId: string) {
  return request<Address[]>({ method: "GET", path: "/addresses/by-entity", params: { addressableType, addressableId } });
}

export function createAddress(input: CreateAddressInput) {
  return request<Address>({ method: "POST", path: "/addresses", body: input });
}

export function updateAddress(id: string, input: UpdateAddressInput) {
  return request<Address>({ method: "PATCH", path: `/addresses/${id}`, body: input });
}

export function setPrimaryAddress(id: string) {
  return request<Address>({ method: "PATCH", path: `/addresses/${id}/primary` });
}

export function deleteAddress(id: string) {
  return request<void>({ method: "DELETE", path: `/addresses/${id}` });
}

// ─── Patient API ──────────────────────────────────────────────

export function fetchPatients(params: { search?: string } & PaginationParams = {}) {
  return request<PaginatedResult<Patient>>({
    method: "GET",
    path: "/patients",
    params: {
      search: params.search,
      page: params.page !== undefined ? String(params.page) : undefined,
      limit: params.limit !== undefined ? String(params.limit) : undefined,
    },
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

export function fetchDoctors(params: { search?: string } & PaginationParams = {}) {
  return request<PaginatedResult<Doctor>>({
    method: "GET",
    path: "/doctors",
    params: {
      search: params.search,
      page: params.page !== undefined ? String(params.page) : undefined,
      limit: params.limit !== undefined ? String(params.limit) : undefined,
    },
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

export function createDoctorWithUser(input: CreateDoctorWithUserInput) {
  return request<DoctorWithUserResult>({
    method: "POST",
    path: "/doctors/with-user",
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

export function fetchQueue(params: { doctorId?: string; date?: string } & PaginationParams = {}) {
  return request<PaginatedResult<QueueEntry>>({
    method: "GET",
    path: "/queue",
    params: {
      doctorId: params.doctorId,
      date: params.date,
      page: params.page !== undefined ? String(params.page) : undefined,
      limit: params.limit !== undefined ? String(params.limit) : undefined,
    },
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

// ─── Employee Schedule API (replaces DoctorSchedule) ─────────

export function fetchEmployeeSchedules(employeeType: string, employeeId: string) {
  return request<EmployeeSchedule[]>({
    method: "GET",
    path: "/employee-schedules",
    params: { employeeSchedulableType: employeeType, employeeSchedulableId: employeeId },
  });
}

export function createEmployeeSchedule(input: CreateEmployeeScheduleInput) {
  return request<EmployeeSchedule>({
    method: "POST",
    path: "/employee-schedules",
    body: input,
  });
}

export function deleteEmployeeSchedule(id: string) {
  return request<void>({
    method: "DELETE",
    path: `/employee-schedules/${id}`,
  });
}

export function fetchDoctorSlots(doctorId: string, date: string) {
  return request<DoctorSlots>({
    method: "GET",
    path: "/employee-schedules/slots",
    params: { employeeSchedulableType: 'Doctor', employeeSchedulableId: doctorId, date },
  });
}

// ─── Shift API ────────────────────────────────────────────────

export interface CreateShiftInput {
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
  isOvernight?: boolean;
  description?: string;
  isActive?: boolean;
}

export function fetchShifts(params: { search?: string } & PaginationParams = {}) {
  return request<PaginatedResult<Shift>>({
    method: "GET",
    path: "/shifts",
    params: {
      search: params.search,
      page: params.page !== undefined ? String(params.page) : undefined,
      limit: params.limit !== undefined ? String(params.limit) : undefined,
    },
  });
}

export function fetchShift(id: string) {
  return request<Shift>({ method: "GET", path: `/shifts/${id}` });
}

export function createShift(input: CreateShiftInput) {
  return request<Shift>({
    method: "POST",
    path: "/shifts",
    body: input,
  });
}

export function updateShift(id: string, input: Partial<CreateShiftInput>) {
  return request<Shift>({
    method: "PATCH",
    path: `/shifts/${id}`,
    body: input,
  });
}

export function deleteShift(id: string) {
  return request<void>({ method: "DELETE", path: `/shifts/${id}` });
}

// ─── Appointment API ──────────────────────────────────────────

export function fetchAppointments(
  params: {
    doctorId?: string;
    date?: string;
    status?: string;
    patientId?: string;
  } & PaginationParams = {},
) {
  return request<PaginatedResult<Appointment>>({
    method: "GET",
    path: "/appointments",
    params: {
      doctorId: params.doctorId,
      date: params.date,
      status: params.status,
      patientId: params.patientId,
      page: params.page !== undefined ? String(params.page) : undefined,
      limit: params.limit !== undefined ? String(params.limit) : undefined,
    },
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

// ─── Billing API ──────────────────────────────────────────────

export function fetchBills(params: { patientId?: string } & PaginationParams = {}) {
  return request<PaginatedResult<Bill>>({
    method: "GET",
    path: "/billing",
    params: {
      patientId: params.patientId,
      page: params.page !== undefined ? String(params.page) : undefined,
      limit: params.limit !== undefined ? String(params.limit) : undefined,
    },
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

// ─── Medicine Catalog API ─────────────────────────────────────

export function fetchMedicines(params: { search?: string } & PaginationParams = {}) {
  return request<PaginatedResult<Medicine>>({
    method: "GET",
    path: "/medicine-catalog",
    params: {
      search: params.search,
      page: params.page !== undefined ? String(params.page) : undefined,
      limit: params.limit !== undefined ? String(params.limit) : undefined,
    },
  });
}

// ─── Prescriptions API ────────────────────────────────────────

export function fetchPrescriptions(params: { patientId?: string } & PaginationParams = {}) {
  return request<PaginatedResult<Prescription>>({
    method: "GET",
    path: "/prescriptions",
    params: {
      patientId: params.patientId,
      page: params.page !== undefined ? String(params.page) : undefined,
      limit: params.limit !== undefined ? String(params.limit) : undefined,
    },
  });
}

// ─── Dispensing API ───────────────────────────────────────────

export function fetchDispensings(params: { prescriptionId?: string } & PaginationParams = {}) {
  return request<PaginatedResult<Dispensing>>({
    method: "GET",
    path: "/dispensing",
    params: {
      prescriptionId: params.prescriptionId,
      page: params.page !== undefined ? String(params.page) : undefined,
      limit: params.limit !== undefined ? String(params.limit) : undefined,
    },
  });
}

// ─── Users API ────────────────────────────────────────────────

export function fetchUsers(params: { search?: string } & PaginationParams = {}) {
  return request<PaginatedResult<User>>({
    method: "GET",
    path: "/users",
    params: {
      search: params.search,
      page: params.page !== undefined ? String(params.page) : undefined,
      limit: params.limit !== undefined ? String(params.limit) : undefined,
    },
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

// ─── Search helpers ───────────────────────────────────────────

export async function searchPatients(query: string) {
  const res = await request<PaginatedResult<Patient>>({
    method: "GET",
    path: "/patients",
    params: { search: query },
  });
  return res.data;
}

export async function searchMedicines(query: string) {
  const res = await request<PaginatedResult<MedicineCatalogItem>>({
    method: "GET",
    path: "/medicine-catalog",
    params: { search: query },
  });
  return res.data;
}

export function createBill(payload: CreateBillInput) {
  return request<Bill>({
    method: "POST",
    path: "/billing",
    body: payload,
  });
}

// ─── User-Doctor Linkage API ────────────────────────────────

export function linkDoctorToUser(doctorId: string) {
  return request<AuthUser>({
    method: "POST",
    path: `/auth/me/link-doctor/${doctorId}`,
  });
}

// ─── Profile API ─────────────────────────────────────────────

export function fetchProfile() {
  return request<AuthUser>({ method: "GET", path: "/auth/me" });
}

export function updateProfile(data: { firstName?: string; lastName?: string; email?: string; mobileNumber?: string; gender?: string; dateOfBirth?: string; profilePhotoUrl?: string; qualification?: string }) {
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
