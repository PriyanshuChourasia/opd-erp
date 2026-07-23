import { apiFetch } from "@/lib/api";
import type {
  RevenueByCategoryData,
  OutstandingBillsData,
  DoctorPerformanceData,
  PrescriptionFulfillmentData,
  TopMedicinesData,
  PatientDemographicsData,
  InactivePatientsData,
  DiagnosticsTurnaroundData,
  AppointmentMixData,
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

export async function fetchPrescriptionFulfillment(from?: string, to?: string): Promise<PrescriptionFulfillmentData> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  const res = await apiFetch<{ data: PrescriptionFulfillmentData }>(`/reports/prescription-fulfillment${qs ? `?${qs}` : ""}`);
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

export async function fetchPatientDemographics(): Promise<PatientDemographicsData> {
  const res = await apiFetch<{ data: PatientDemographicsData }>("/reports/patient-demographics");
  return res.data;
}

export async function fetchInactivePatients(daysSinceLastVisit?: number, page?: number): Promise<InactivePatientsData> {
  const params = new URLSearchParams();
  if (daysSinceLastVisit) params.set("daysSinceLastVisit", String(daysSinceLastVisit));
  if (page) params.set("page", String(page));
  const qs = params.toString();
  return apiFetch<InactivePatientsData>(`/reports/inactive-patients${qs ? `?${qs}` : ""}`);
}

export async function fetchDiagnosticsTurnaround(from?: string, to?: string): Promise<DiagnosticsTurnaroundData> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  const res = await apiFetch<{ data: DiagnosticsTurnaroundData }>(`/reports/diagnostics-turnaround${qs ? `?${qs}` : ""}`);
  return res.data;
}

export async function fetchAppointmentMix(from?: string, to?: string): Promise<AppointmentMixData> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  const res = await apiFetch<{ data: AppointmentMixData }>(`/reports/appointment-mix${qs ? `?${qs}` : ""}`);
  return res.data;
}
