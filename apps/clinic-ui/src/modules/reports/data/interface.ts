// ─── 1. Revenue by Category ──────────────────────────
export interface RevenueByCategoryData {
  byCategory: { itemType: string; amount: number }[];
  byPaymentMethod: { paymentMethod: string; amount: number }[];
  totalRevenue: number;
}

// ─── 2. Outstanding Bills ────────────────────────────
export interface OutstandingBill {
  id: string;
  invoiceNo: string;
  patientName: string;
  patientPhone: string;
  total: number;
  status: string;
  ageDays: number;
  createdAt: string;
}

export interface BucketSummary {
  bucket: string;
  count: number;
  amount: number;
}

export interface OutstandingBillsData {
  bills: OutstandingBill[];
  bucketSummary: BucketSummary[];
}

// ─── 3. Doctor Performance ───────────────────────────
export interface DoctorPerformanceRow {
  doctorId: string;
  specialization: string;
  registrationNo: string;
  consultationFee: number;
  totalAppointments: number;
  completedCount: number;
  noShowCount: number;
  noShowRate: number;
  revenue: number;
}

export type DoctorPerformanceData = DoctorPerformanceRow[];

// ─── 4. Prescription Fulfillment ─────────────────────
export interface PrescriptionStatusBreakdown {
  status: string;
  count: number;
}

export interface UnfulfilledPrescription {
  prescriptionId: string;
  patientName: string;
  doctorId: string;
  daysPending: number;
}

export interface PrescriptionFulfillmentData {
  statusBreakdown: PrescriptionStatusBreakdown[];
  unfulfilled: UnfulfilledPrescription[];
}

// ─── 5. Top Medicines ───────────────────────────────
export interface MedicineVolume {
  medicine: string;
  quantity: number;
}

export interface MedicineRevenue {
  medicine: string;
  amount: number;
}

export interface TopMedicinesData {
  byVolume: MedicineVolume[];
  byRevenue: MedicineRevenue[];
}

// ─── 6. Patient Demographics ────────────────────────
export interface GenderCount {
  gender: string;
  count: number;
}

export interface BloodGroupCount {
  bloodGroup: string;
  count: number;
}

export interface AgeGroupCount {
  ageGroup: string;
  count: number;
}

export interface NewVsReturning {
  month: string;
  newCount: number;
  followUpCount: number;
}

export interface PatientDemographicsData {
  byGender: GenderCount[];
  byBloodGroup: BloodGroupCount[];
  byAgeGroup: AgeGroupCount[];
  newVsReturningTrend: NewVsReturning[];
}

// ─── 7. Inactive Patients ───────────────────────────
export interface InactivePatient {
  patientId: string;
  name: string;
  phone: string;
  lastVisitDate: string;
  daysSinceLastVisit: number;
}

export interface InactivePatientsData {
  data: InactivePatient[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// ─── 8. Diagnostics Turnaround ──────────────────────
export interface AvgTurnaround {
  orderType: string;
  category: string;
  avgHours: number;
  count: number;
}

export interface OrderStatusBreakdown {
  orderType: string;
  status: string;
  count: number;
}

export interface DiagnosticsTurnaroundData {
  avgTurnaroundByType: AvgTurnaround[];
  statusBreakdown: OrderStatusBreakdown[];
}

// ─── 9. Appointment Mix ─────────────────────────────
export interface AppointmentTypeCount {
  type: string;
  count: number;
}

export interface AppointmentStatusCount {
  status: string;
  count: number;
}

export interface CancellationReason {
  reason: string;
  count: number;
}

export interface AppointmentMixData {
  byType: AppointmentTypeCount[];
  byStatus: AppointmentStatusCount[];
  cancellationReasons: CancellationReason[];
}
