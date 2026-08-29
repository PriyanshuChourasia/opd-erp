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

// ─── 4. Top Medicines ───────────────────────────────
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
