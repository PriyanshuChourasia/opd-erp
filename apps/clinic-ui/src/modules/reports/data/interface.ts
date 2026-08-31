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

// ─── 10. Daily OPD Summary ──────────────────────────────
export interface DailyOpdSummaryData {
  summary: {
    totalAppointments: number;
    completedAppointments: number;
    pendingAppointments: number;
    cancelledAppointments: number;
    noShowAppointments: number;
    walkInAppointments: number;
    newPatients: number;
    returningPatients: number;
    totalConsultationAmount: number;
    totalRegistrationAmount: number;
    totalAmountCollected: number;
    pendingAmount: number;
    outstandingInvoices: number;
    completionRate: number;
    cancellationRate: number;
    noShowRate: number;
  };
  byDoctor: {
    doctorId: string;
    totalAppointments: number;
    completed: number;
    revenue: number;
  }[];
  byType: {
    type: string;
    count: number;
    percentage: number;
  }[];
  byStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
  byHour: {
    hour: number;
    count: number;
  }[];
}

export interface ReportMeta {
  from: string;
  to: string;
  generatedAt: string;
  filters?: Record<string, string | number | boolean | undefined>;
}

export interface DailyOpdSummaryResponse {
  success: boolean;
  data: DailyOpdSummaryData;
  meta: ReportMeta;
}

// ─── 11. Doctor-wise OPD Report ────────────────────────────
export interface DoctorWiseOpdRow {
  doctorId: string;
  specialization: string;
  registrationNo: string;
  consultationFee: number;
  totalAppointments: number;
  completed: number;
  cancelled: number;
  noShow: number;
  uniquePatients: number;
  newPatients: number;
  followUpPatients: number;
  consultationRevenue: number;
  avgPatientsPerDay: number;
  avgConsultationAmount: number;
}

export interface DoctorWiseOpdSummary {
  totalDoctors: number;
  activeDoctors: number;
  totalAppointments: number;
  totalRevenue: number;
  totalPatients: number;
  avgAppointmentsPerDoctor: number;
}

export interface DoctorWiseOpdData {
  summary: DoctorWiseOpdSummary;
  doctors: DoctorWiseOpdRow[];
}

export interface DoctorWiseOpdResponse {
  success: boolean;
  data: DoctorWiseOpdData;
  meta: ReportMeta;
}

// ─── 12. Revenue / Collection Report ──────────────────────────
export interface RevenueCollectionRow {
  date: string;
  appointmentId: string | null;
  patientName: string;
  doctorName: string;
  registrationFee: number;
  consultationFee: number;
  otherAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountPending: number;
  paymentMethod: string;
  transactionReference: string | null;
  invoiceNumber: string | null;
  paymentStatus: string;
}

export interface RevenueCollectionSummary {
  totalRows: number;
  totalRegistrationFee: number;
  totalConsultationFee: number;
  totalOtherAmount: number;
  totalBilledAmount: number;
  totalPaidAmount: number;
  totalPendingAmount: number;
  byPaymentMethod: {
    method: string;
    count: number;
    amount: number;
  }[];
  byPaymentStatus: {
    status: string;
    count: number;
    amount: number;
  }[];
}

export interface RevenueCollectionPagination {
  page: number;
  limit: number;
  totalPages: number;
  totalRecords: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface RevenueCollectionData {
  summary: RevenueCollectionSummary;
  rows: RevenueCollectionRow[];
}

export interface RevenueCollectionResponse {
  success: boolean;
  data: RevenueCollectionData;
  pagination: RevenueCollectionPagination;
  meta: ReportMeta;
}

// ─── 13. Outstanding / Pending Payment Report ──────────────
export interface OutstandingPaymentRow {
  id: string;
  invoiceNo: string;
  patientId: string | null;
  patientName: string;
  patientPhone: string | null;
  appointmentId: string | null;
  appointmentDate: string | null;
  doctorId: string | null;
  doctorName: string;
  doctorSpecialization: string | null;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentMethod: string;
  referenceNumber: string | null;
  status: string;
  createdAt: string;
}

export interface AgingBucket {
  bucket: string;
  count: number;
  amount: number;
}

export interface OutstandingPaymentStatusBreakdown {
  status: string;
  count: number;
  amount: number;
}

export interface OutstandingPaymentSummary {
  totalRecords: number;
  totalBilledAmount: number;
  totalPaidAmount: number;
  totalPendingAmount: number;
  agingBuckets: AgingBucket[];
  byStatus: OutstandingPaymentStatusBreakdown[];
}

export interface OutstandingPaymentData {
  summary: OutstandingPaymentSummary;
  rows: OutstandingPaymentRow[];
}

export interface OutstandingPaymentResponse {
  success: boolean;
  data: OutstandingPaymentData;
  pagination: RevenueCollectionPagination;
  meta: ReportMeta;
}
