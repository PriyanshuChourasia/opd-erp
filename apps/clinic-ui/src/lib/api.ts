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

export interface Patient {
  id: string;
  patientCode: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  contactNo: string;
  altContactNo?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  allergies: string[];
  patientAllergies?: PatientAllergy[];
  isFollowUp: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  contactNo: string;
  altContactNo?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  emergencyContact?: string;
  allergies?: string[];
  isFollowUp?: boolean;
}

/** Get the full display name of a patient */
export function getPatientName(patient: { firstName: string; middleName?: string | null; lastName: string }): string {
  return `${patient.firstName} ${patient.middleName ? patient.middleName + " " : ""}${patient.lastName}`;
}

export interface Doctor {
  id: string;
  /** Resolved off the linked User account; null if no User is linked yet. */
  name?: string | null;
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
}

/**
 * Unified input for creating a Doctor together with its User account
 * and an optional Address in a single API call.
 */
export interface AddressEntry {
  addressType?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  isPrimary?: boolean;
}

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

  // Addresses (new: supports multiple)
  addresses?: AddressEntry[];

  // Legacy flat address fields (backward compat)
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
  tokenNumber: string;
  patientId: string;
  doctorId: string;
  status: string;
  queueDate: string;
  checkedInAt: string | null;
  createdAt: string;
  patient: Patient;
  doctor: Doctor;
  appointment?: { id: string; fee: number; date: string; bill: { id: string; invoiceNo: string; status: string } | null } | null;
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
  | "RESCHEDULED"
  | "NO_SHOW";

export interface AppointmentBillSummary {
  id: string;
  invoiceNo: string;
  status: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  createdById?: string | null;
  date: string;
  type: string;
  status: string;
  tokenNumber: string | null;
  fee: number;
  registrationFee: number;
  reasonForVisit: string | null;
  notes: string | null;
  cancellationReason: string | null;
  patient: Patient;
  doctor: Doctor;
  bill: AppointmentBillSummary | null;
}

export interface AppointmentInvoicePreview {
  appointment: Appointment;
  alreadyInvoiced: boolean;
  items: BillItemInput[];
}

export interface CreateAppointmentInput {
  patientId: string;
  doctorId: string;
  date: string;
  type: AppointmentType;
  fee: number;
  registrationFee?: number;
  reasonForVisit?: string;
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

export type PrescriptionStatus = "ACTIVE" | "DISPENSED" | "CANCELLED" | "COMPLETED" | "DISCONTINUED";

export interface PrescriptionHistoryEntry {
  id: string;
  prescriptionId: string;
  version: number;
  diagnosis?: string | null;
  notes?: string | null;
  status: string;
  items: { medicineId: string; medicineName: string; dosage: string; duration?: string | null; instructions?: string | null; quantity: number; refills: number }[];
  changeType: string;
  changeReason?: string | null;
  createdAt: string;
  createdBy?: { id: string; firstName: string; lastName: string } | null;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  diagnosis?: string | null;
  notes?: string | null;
  status: PrescriptionStatus;
  version: number;
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
  appointmentId?: string;
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
  appointmentId: string | null;
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
  appointment?: { id: string; doctorId: string; type: string; date: string; doctorName: string | null } | null;
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

// ─── Allergy Types ─────────────────────────────────────────

export type AllergySeverity = "MILD" | "MODERATE" | "SEVERE" | "LIFE_THREATENING";
export type AllergyCategory = "DRUG" | "FOOD" | "ENVIRONMENTAL" | "OTHER";

export const ALLERGY_SEVERITIES: AllergySeverity[] = ["MILD", "MODERATE", "SEVERE", "LIFE_THREATENING"];
export const ALLERGY_CATEGORIES: AllergyCategory[] = ["DRUG", "FOOD", "ENVIRONMENTAL", "OTHER"];

export interface Allergy {
  id: string;
  name: string;
  description?: string | null;
  severity: AllergySeverity;
  category: AllergyCategory;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAllergyInput {
  name: string;
  description?: string;
  severity?: AllergySeverity;
  category?: AllergyCategory;
  isActive?: boolean;
}

export interface PatientAllergy {
  id: string;
  patientId: string;
  allergyId: string;
  notes?: string | null;
  severityOverride?: AllergySeverity | null;
  createdAt: string;
  allergy: Allergy;
}

// ─── Allergy API ────────────────────────────────────────────

export function fetchAllergies(params: { search?: string; category?: string; severity?: string } & PaginationParams = {}) {
  return request<PaginatedResult<Allergy>>({
    method: "GET",
    path: "/allergies",
    params: {
      search: params.search,
      category: params.category,
      severity: params.severity,
      page: params.page !== undefined ? String(params.page) : undefined,
      limit: params.limit !== undefined ? String(params.limit) : undefined,
    },
  });
}

export function fetchAllergy(id: string) {
  return request<Allergy>({ method: "GET", path: `/allergies/${id}` });
}

export function createAllergy(input: CreateAllergyInput) {
  return request<Allergy>({ method: "POST", path: "/allergies", body: input });
}

export function updateAllergy(id: string, input: Partial<CreateAllergyInput>) {
  return request<Allergy>({ method: "PATCH", path: `/allergies/${id}`, body: input });
}

export function deleteAllergy(id: string) {
  return request<void>({ method: "DELETE", path: `/allergies/${id}` });
}

// ─── Diagnosis System Types ─────────────────────────────────

export interface DiagnosisSystem {
  id: string;
  code: string;
  name: string;
  version?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiagnosisSystemInput {
  code: string;
  name: string;
  version?: string;
  status?: string;
}

export function fetchDiagnosisSystems(params: { search?: string } & PaginationParams = {}) {
  return request<PaginatedResult<DiagnosisSystem>>({
    method: "GET",
    path: "/diagnosis-systems",
    params: {
      search: params.search,
      page: params.page !== undefined ? String(params.page) : undefined,
      limit: params.limit !== undefined ? String(params.limit) : undefined,
    },
  });
}

export function fetchDiagnosisSystem(id: string) {
  return request<DiagnosisSystem>({ method: "GET", path: `/diagnosis-systems/${id}` });
}

export function createDiagnosisSystem(input: CreateDiagnosisSystemInput) {
  return request<DiagnosisSystem>({ method: "POST", path: "/diagnosis-systems", body: input });
}

export function updateDiagnosisSystem(id: string, input: Partial<CreateDiagnosisSystemInput>) {
  return request<DiagnosisSystem>({ method: "PATCH", path: `/diagnosis-systems/${id}`, body: input });
}

export function deleteDiagnosisSystem(id: string) {
  return request<void>({ method: "DELETE", path: `/diagnosis-systems/${id}` });
}

// ─── Diagnosis Types ────────────────────────────────────────

export interface Diagnosis {
  id: string;
  diagnosisSystemId?: string | null;
  diagnosisSystem?: DiagnosisSystem | null;
  code: string;
  name: string;
  description?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiagnosisInput {
  diagnosisSystemId?: string;
  code: string;
  name: string;
  description?: string;
  status?: string;
}

// ─── Diagnosis API ──────────────────────────────────────────

export function fetchDiagnoses(params: { search?: string; diagnosisSystemId?: string; status?: string } & PaginationParams = {}) {
  return request<PaginatedResult<Diagnosis>>({
    method: "GET",
    path: "/diagnoses",
    params: {
      search: params.search,
      diagnosisSystemId: params.diagnosisSystemId,
      status: params.status,
      page: params.page !== undefined ? String(params.page) : undefined,
      limit: params.limit !== undefined ? String(params.limit) : undefined,
    },
  });
}

export function fetchDiagnosis(id: string) {
  return request<Diagnosis>({ method: "GET", path: `/diagnoses/${id}` });
}

export function createDiagnosis(input: CreateDiagnosisInput) {
  return request<Diagnosis>({ method: "POST", path: "/diagnoses", body: input });
}

export function updateDiagnosis(id: string, input: Partial<CreateDiagnosisInput>) {
  return request<Diagnosis>({ method: "PATCH", path: `/diagnoses/${id}`, body: input });
}

export function deleteDiagnosis(id: string) {
  return request<void>({ method: "DELETE", path: `/diagnoses/${id}` });
}

// ─── Patient Vitals Types & API ──────────────────────────────

export interface PatientVitals {
  id: string;
  patientId: string;
  appointmentId?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  bmi?: number | null;
  temperatureC?: number | null;
  pulseBpm?: number | null;
  systolicBp?: number | null;
  diastolicBp?: number | null;
  spo2Percent?: number | null;
  respiratoryRate?: number | null;
  medicalStatus?: string | null;
  recordedAt: string;
  createdAt: string;
}

export interface CreatePatientVitalsInput {
  patientId: string;
  appointmentId?: string;
  heightCm?: number;
  weightKg?: number;
  temperatureC?: number;
  pulseBpm?: number;
  systolicBp?: number;
  diastolicBp?: number;
  spo2Percent?: number;
  respiratoryRate?: number;
  medicalStatus?: string;
}

export const MEDICAL_STATUSES = [
  "Before Fasting",
  "After Fasting",
  "Before Meals",
  "After Meals",
  "Before Sleep",
  "After Waking Up",
  "After Exercise",
  "At Rest",
  "During Stress",
  "Before Medication",
  "After Medication",
  "During Menstruation",
  "Pregnancy",
  "Post Surgery",
  "Other",
] as const;

export function createPatientVitals(input: CreatePatientVitalsInput) {
  return request<PatientVitals>({ method: "POST", path: "/patient-vitals", body: input });
}

export function fetchPatientVitalsLatest(patientId: string) {
  return request<PatientVitals | null>({ method: "GET", path: `/patient-vitals/latest/${patientId}` });
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

export function fetchDoctors(params: { search?: string; isActive?: string } & PaginationParams = {}) {
  return request<PaginatedResult<Doctor>>({
    method: "GET",
    path: "/doctors",
    params: {
      search: params.search,
      isActive: params.isActive,
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

/** Fetch the linked User account for a doctor */
export function fetchDoctorUser(doctorId: string) {
  return request<{
    id: string;
    username: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    email: string;
    mobileNumber?: string | null;
    gender?: string | null;
    roleId: string;
  }>({
    method: "GET",
    path: `/doctors/${doctorId}/user`,
  });
}

/** Update doctor + linked user + address in one call */
export function updateDoctorWithUser(id: string, input: Partial<CreateDoctorWithUserInput>) {
  return request<Doctor>({
    method: "PATCH",
    path: `/doctors/${id}/with-user`,
    body: input,
  });
}

/** Soft-delete a doctor by setting isActive=false. The record is preserved. */
export function deleteDoctor(id: string) {
  return request<Doctor>({ method: "DELETE", path: `/doctors/${id}` });
}

/** Restore a previously dropped (soft-deleted) doctor. */
export function restoreDoctor(id: string) {
  return request<Doctor>({ method: "PATCH", path: `/doctors/${id}/restore` });
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

export interface QueueDisplayEntry {
  tokenNumber: string;
  status: string;
  doctorName: string;
}

export function fetchQueueDisplay() {
  return request<QueueDisplayEntry[]>({
    method: "GET",
    path: "/queue/display",
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
    path: "/employee-schedules/by-employee",
    params: { employeeSchedulableType: employeeType, employeeSchedulableId: employeeId },
  });
}

export function fetchAllDoctorSchedules() {
  return request<{ data: EmployeeSchedule[] }>({
    method: "GET",
    path: "/employee-schedules",
    params: { employeeSchedulableType: "Doctor", limit: "500" },
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
    createdById?: string;
    search?: string;
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
      createdById: params.createdById,
      search: params.search,
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

export function updateAppointmentStatus(id: string, status: AppointmentStatus, cancellationReason?: string) {
  return request<Appointment>({
    method: "PATCH",
    path: `/appointments/${id}/status`,
    body: { status, cancellationReason },
  });
}

export function rescheduleAppointment(id: string, input: { date: string; doctorId?: string }) {
  return request<Appointment>({
    method: "PATCH",
    path: `/appointments/${id}/reschedule`,
    body: input,
  });
}

export function deleteAppointment(id: string) {
  return request<void>({
    method: "DELETE",
    path: `/appointments/${id}`,
  });
}

export function fetchAppointment(id: string) {
  return request<Appointment>({
    method: "GET",
    path: `/appointments/${id}`,
  });
}

export interface UpdateAppointmentInput {
  date?: string;
  doctorId?: string;
  type?: string;
  fee?: number;
  registrationFee?: number;
  reasonForVisit?: string;
  notes?: string;
  status?: string;
  cancellationReason?: string;
}

export function updateAppointment(id: string, input: UpdateAppointmentInput) {
  return request<Appointment>({
    method: "PATCH",
    path: `/appointments/${id}`,
    body: input,
  });
}

export function fetchAppointmentInvoicePreview(id: string) {
  return request<AppointmentInvoicePreview>({
    method: "GET",
    path: `/appointments/${id}/invoice-preview`,
  });
}

export function checkoutAppointment(id: string, payload?: { paymentMethod?: string; discount?: number; tax?: number; notes?: string }) {
  return request<Bill>({
    method: "POST",
    path: `/appointments/${id}/checkout`,
    body: payload ?? {},
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
  return request<RoleUser[]>({ method: "GET", path: `/roles/${roleId}/users` });
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

export function fetchPrescriptions(
  params: { patientId?: string; doctorId?: string; status?: string; search?: string; date?: string } & PaginationParams = {},
) {
  return request<PaginatedResult<Prescription>>({
    method: "GET",
    path: "/prescriptions",
    params: {
      patientId: params.patientId,
      doctorId: params.doctorId,
      status: params.status,
      search: params.search,
      date: params.date,
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

// ─── Users API (Full CRUD) ───────────────────────────────────

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

export function fetchUsers(params: { search?: string; isActive?: string } & PaginationParams = {}) {
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
  return request<RoleOption[]>({
    method: "GET",
    path: "/users/roles",
  });
}

export function createUser(input: CreateUserInput) {
  return request<User>({ method: "POST", path: "/users", body: input });
}

export function updateUser(id: string, input: UpdateUserInput) {
  return request<User>({ method: "PATCH", path: `/users/${id}`, body: input });
}

/** Soft-delete a user by setting isActive=false */
export function deleteUser(id: string) {
  return request<User>({ method: "DELETE", path: `/users/${id}` });
}

/** Restore a previously soft-deleted user */
export function restoreUser(id: string) {
  return request<User>({ method: "PATCH", path: `/users/${id}/restore` });
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

// ─── Prescription Template API ───────────────────────────────

export type TemplateType = "prescription" | "diagnosis" | "test";

export interface PrescriptionTemplate {
  id: string;
  name: string;
  type: TemplateType;
  description?: string | null;
  isDefault: boolean;
  doctorId?: string | null;
  logoUrl?: string | null;
  clinicName?: string | null;
  doctorName?: string | null;
  doctorSpecialization?: string | null;
  doctorQualification?: string | null;
  doctorRegNo?: string | null;
  clinicAddress?: string | null;
  clinicPhone?: string | null;
  clinicEmail?: string | null;
  clinicWebsite?: string | null;
  layout: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePrescriptionTemplateInput {
  name: string;
  type?: TemplateType;
  description?: string;
  isDefault?: boolean;
  logoUrl?: string;
  clinicName?: string;
  doctorName?: string;
  doctorSpecialization?: string;
  doctorQualification?: string;
  doctorRegNo?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  clinicEmail?: string;
  clinicWebsite?: string;
  layout?: Record<string, any>;
}

export interface UpdatePrescriptionTemplateInput extends Partial<CreatePrescriptionTemplateInput> {}

export function fetchPrescriptionTemplates() {
  return request<PrescriptionTemplate[]>({ method: "GET", path: "/prescription-templates" });
}

export function fetchDefaultPrescriptionTemplate() {
  return request<PrescriptionTemplate | null>({ method: "GET", path: "/prescription-templates/default" });
}

export function fetchPrescriptionTemplate(id: string) {
  return request<PrescriptionTemplate>({ method: "GET", path: `/prescription-templates/${id}` });
}

export function createPrescriptionTemplate(data: CreatePrescriptionTemplateInput) {
  return request<PrescriptionTemplate>({ method: "POST", path: "/prescription-templates", body: data });
}

export function updatePrescriptionTemplate(id: string, data: UpdatePrescriptionTemplateInput) {
  return request<PrescriptionTemplate>({ method: "PATCH", path: `/prescription-templates/${id}`, body: data });
}

export function setDefaultPrescriptionTemplate(id: string) {
  return request<PrescriptionTemplate>({ method: "PATCH", path: `/prescription-templates/${id}/default` });
}

export function deletePrescriptionTemplate(id: string) {
  return request<void>({ method: "DELETE", path: `/prescription-templates/${id}` });
}

export function fetchPrescriptionTemplateForDoctor(doctorId: string) {
  return request<PrescriptionTemplate | null>({ method: "GET", path: `/prescription-templates/for-doctor/${doctorId}` });
}

export function assignPrescriptionTemplateToDoctor(id: string, doctorId: string) {
  return request<PrescriptionTemplate>({ method: "PATCH", path: `/prescription-templates/${id}/assign-doctor`, body: { doctorId } });
}

export function unassignPrescriptionTemplateFromDoctor(id: string) {
  return request<PrescriptionTemplate>({ method: "PATCH", path: `/prescription-templates/${id}/unassign-doctor` });
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
  return request<SidebarMenuItem[]>({ method: "GET", path: "/sidebar-config" });
}

export function fetchSidebarConfigForRole(roleId: string) {
  return request<SidebarMenuItem[]>({ method: "GET", path: `/sidebar-config/for-role/${roleId}` });
}

export function createSidebarMenuItem(data: { label: string; path: string; icon?: string; group: string; sortOrder?: number; isHidden?: boolean; roleIds?: string[] }) {
  return request<SidebarMenuItem>({ method: "POST", path: "/sidebar-config", body: data });
}

export function updateSidebarMenuItem(id: string, data: { label?: string; path?: string; icon?: string; group?: string; sortOrder?: number; isHidden?: boolean; roleIds?: string[] }) {
  return request<SidebarMenuItem>({ method: "PATCH", path: `/sidebar-config/${id}`, body: data });
}

export function deleteSidebarMenuItem(id: string) {
  return request<void>({ method: "DELETE", path: `/sidebar-config/${id}` });
}

export function assignRolesToMenuItem(id: string, roleIds: string[]) {
  return request<SidebarMenuItem>({ method: "PATCH", path: `/sidebar-config/${id}/assign-roles`, body: { roleIds } });
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

export interface CreatePrescriptionItemInput {
  medicineId: string;
  medicineName: string;
  dosage: string;
  duration?: string;
  instructions?: string;
  quantity: number;
  refills?: number;
}

export interface CreatePrescriptionInput {
  patientId: string;
  doctorId: string;
  diagnosis?: string;
  notes?: string;
  items: CreatePrescriptionItemInput[];
}

export function createPrescription(input: CreatePrescriptionInput) {
  return request<Prescription>({
    method: "POST",
    path: "/prescriptions",
    body: input,
  });
}

export interface UpdatePrescriptionInput {
  diagnosis?: string;
  notes?: string;
  status?: PrescriptionStatus;
  items?: CreatePrescriptionItemInput[];
  changeReason?: string;
}

export function updatePrescription(id: string, input: UpdatePrescriptionInput) {
  return request<Prescription>({
    method: "PATCH",
    path: `/prescriptions/${id}`,
    body: input,
  });
}

export function fetchPrescriptionHistory(prescriptionId: string) {
  return request<PrescriptionHistoryEntry[]>({
    method: "GET",
    path: `/prescriptions/${prescriptionId}/history`,
  });
}

export interface ProcedureOrder {
  id: string;
  patientId: string;
  doctorId: string;
  procedureName: string;
  category?: string | null;
  notes?: string | null;
  status: string;
  createdAt: string;
}

export interface CreateProcedureOrderInput {
  patientId: string;
  doctorId: string;
  procedureName: string;
  category?: string;
  notes?: string;
}

export function createProcedureOrder(input: CreateProcedureOrderInput) {
  return request<ProcedureOrder>({
    method: "POST",
    path: "/procedure-orders",
    body: input,
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

// ─── Module Registry API ─────────────────────────────────────

export interface ModuleAction {
  id: string;
  name: string;
  description: string;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path?: string;
  /** Human-readable description of the expected request (params/body shape). */
  request?: string;
  /** Human-readable description of the response payload shape. */
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

export type ModuleUpsertInput = Partial<Omit<AppModule, "features">> & {
  id: string;
  name: string;
  description: string;
  version: string;
  /** Loose feature tree — mirrors IModuleRegistry on the backend. */
  features?: unknown[];
};

export function createModule(definition: ModuleUpsertInput) {
  return request<{ data: AppModule }>({
    method: "POST",
    path: "/modules",
    body: definition,
  });
}

export function updateModule(id: string, definition: ModuleUpsertInput) {
  return request<{ data: AppModule }>({
    method: "PATCH",
    path: `/modules/${id}`,
    body: definition,
  });
}

export function deleteModule(id: string) {
  return request<{ message: string }>({
    method: "DELETE",
    path: `/modules/${id}`,
  });
}

// ─── Schema API ──────────────────────────────────────────────

export interface SchemaField {
  name: string;
  type: string;
  kind: "scalar" | "object" | "enum" | "unsupported";
  isRequired: boolean;
  isList: boolean;
  isId: boolean;
  isUnique: boolean;
  hasDefault: boolean;
  isUpdatedAt: boolean;
  /** For relations: FK columns on THIS model ([] = back-relation, FK lives on the other side). */
  relationFromFields: string[];
  /** For relations: the referenced columns on the other model (usually ["id"]). */
  relationToFields: string[];
}

export interface SchemaModel {
  name: string;
  fields: SchemaField[];
  relations: string[];
  uniqueFields: string[][];
}

export interface SchemaEnum {
  name: string;
  values: string[];
}

export interface DatabaseSchema {
  models: SchemaModel[];
  enums: SchemaEnum[];
}

export function fetchSchema() {
  return request<{ data: DatabaseSchema; total: number }>({
    method: "GET",
    path: "/database-schema",
  });
}

export function fetchSchemaModel(name: string) {
  return request<{ data: SchemaModel }>({
    method: "GET",
    path: `/database-schema/${name}`,
  });
}

export type SchemaChangeKind = "REMARK" | "REMOVE" | "EDIT" | "ADD";

export interface SchemaFieldChange {
  id: string;
  modelName: string;
  fieldName: string;
  kind: SchemaChangeKind;
  remark?: string | null;
  editedName?: string | null;
  editedType?: string | null;
  fieldType?: string | null;
  /** For ADD rows representing a foreign key: target Prisma model. */
  targetModel?: string | null;
  isRequired: boolean;
  isList: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SchemaChangeInput {
  fieldName: string;
  kind: SchemaChangeKind;
  remark?: string;
  editedName?: string;
  editedType?: string;
  fieldType?: string;
  /** For ADD rows representing a foreign key: target Prisma model. */
  targetModel?: string;
  isRequired?: boolean;
  isList?: boolean;
}

export function fetchSchemaChanges(modelName: string) {
  return request<{ data: SchemaFieldChange[] }>({
    method: "GET",
    path: `/database-schema/${modelName}/changes`,
  });
}

export function saveSchemaChanges(modelName: string, changes: SchemaChangeInput[]) {
  return request<{ data: SchemaFieldChange[] }>({
    method: "PUT",
    path: `/database-schema/${modelName}/changes`,
    body: { changes },
  });
}

// ─── Document API ────────────────────────────────────────────

export interface DocumentRecord {
  id: string;
  documentType: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  caption: string | null;
  isPrimary: boolean;
  isActive: boolean;
  documentableType: string;
  documentableId: string;
  createdAt: string;
  updatedAt: string;
}

export function fetchDocumentsByEntity(documentableType: string, documentableId: string) {
  return request<DocumentRecord[]>({
    method: "GET",
    path: "/documents/by-entity",
    params: { documentableType, documentableId },
  });
}

export function fetchBatchProfilePhotos(documentableType: string, ids: string[]) {
  return request<DocumentRecord[]>({
    method: "GET",
    path: "/documents/batch-profile-photos",
    params: { documentableType, ids: ids.join(',') },
  });
}

export function uploadDocument(
  file: File,
  documentType: string,
  documentableType: string,
  documentableId: string,
  options?: { caption?: string; isPrimary?: boolean },
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("documentType", documentType);
  formData.append("documentableType", documentableType);
  formData.append("documentableId", documentableId);
  if (options?.caption) formData.append("caption", options.caption);
  if (options?.isPrimary) formData.append("isPrimary", "true");

  return apiClient.post<DocumentRecord>("/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((res) => res.data);
}

export function deleteDocument(id: string) {
  return request<void>({ method: "DELETE", path: `/documents/${id}` });
}

export function setPrimaryDocument(id: string) {
  return request<DocumentRecord>({ method: "PATCH", path: `/documents/${id}/primary` });
}

/** Downloads a document as its original file, going through the authenticated API instead of the static /uploads path. */
export async function downloadDocument(id: string, originalName: string) {
  const res = await apiClient.get(`/documents/${id}/download`, { responseType: "blob" });
  const url = URL.createObjectURL(res.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = originalName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
