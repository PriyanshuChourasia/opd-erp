import { apiFetch } from "@/lib/api";
import type {
  RevenueByCategoryData,
  OutstandingBillsData,
  DoctorPerformanceData,
  TopMedicinesData,
  DailyOpdSummaryResponse,
  DoctorWiseOpdResponse,
  RevenueCollectionResponse,
  OutstandingPaymentResponse,
} from "./interface";

export async function fetchRevenueByCategory(from?: string, to?: string): Promise<RevenueByCategoryData> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  const res = await apiFetch<{ data: RevenueByCategoryData }>(`/reports/revenue-by-category${qs ? `?${qs}` : ""}`);
  return res.data;
}

export async function fetchOutstandingBills(): Promise<OutstandingBillsData> {
  const res = await apiFetch<{ data: OutstandingBillsData }>("/reports/outstanding-bills");
  return res.data;
}

export async function fetchDoctorPerformance(from?: string, to?: string): Promise<DoctorPerformanceData> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  const res = await apiFetch<{ data: DoctorPerformanceData }>(`/reports/doctor-performance${qs ? `?${qs}` : ""}`);
  return res.data;
}

export async function fetchTopMedicines(from?: string, to?: string, limit?: number): Promise<TopMedicinesData> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  const res = await apiFetch<{ data: TopMedicinesData }>(`/reports/top-medicines${qs ? `?${qs}` : ""}`);
  return res.data;
}

export async function fetchDailyOpdSummary(
  from?: string,
  to?: string,
  doctorId?: string,
): Promise<DailyOpdSummaryResponse> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (doctorId) params.set("doctorId", doctorId);
  const qs = params.toString();
  const res = await apiFetch<DailyOpdSummaryResponse>(`/reports/daily-opd-summary${qs ? `?${qs}` : ""}`);
  return res;
}

export async function fetchDoctorWiseOpdReport(
  from?: string,
  to?: string,
): Promise<DoctorWiseOpdResponse> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  const res = await apiFetch<DoctorWiseOpdResponse>(`/reports/doctor-wise-opd${qs ? `?${qs}` : ""}`);
  return res;
}

export async function fetchRevenueCollectionReport(
  from?: string,
  to?: string,
  doctorId?: string,
  paymentStatus?: string,
  paymentMethod?: string,
  page?: number,
  limit?: number,
): Promise<RevenueCollectionResponse> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (doctorId) params.set("doctorId", doctorId);
  if (paymentStatus) params.set("paymentStatus", paymentStatus);
  if (paymentMethod) params.set("paymentMethod", paymentMethod);
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  const res = await apiFetch<RevenueCollectionResponse>(`/reports/revenue-collection${qs ? `?${qs}` : ""}`);
  return res;
}

export async function fetchOutstandingPayments(
  from?: string,
  to?: string,
  doctorId?: string,
  patientId?: string,
  paymentStatus?: string,
  page?: number,
  limit?: number,
): Promise<OutstandingPaymentResponse> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (doctorId) params.set("doctorId", doctorId);
  if (patientId) params.set("patientId", patientId);
  if (paymentStatus) params.set("paymentStatus", paymentStatus);
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  const res = await apiFetch<OutstandingPaymentResponse>(`/reports/outstanding-payments${qs ? `?${qs}` : ""}`);
  return res;
}
