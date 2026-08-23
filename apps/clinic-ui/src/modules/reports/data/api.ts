import { apiFetch } from "@/lib/api";
import type {
  RevenueByCategoryData,
  OutstandingBillsData,
  DoctorPerformanceData,
  TopMedicinesData,
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
