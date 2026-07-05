import { apiFetch, type Appointment, type CreateAppointmentInput, type Bill } from "@/lib/api";
import type { PaymentMethod } from "./interface";

export async function fetchAppointments(filters?: { doctorId?: string; date?: string; patientId?: string }): Promise<Appointment[]> {
  const params = new URLSearchParams();
  if (filters?.doctorId) params.set("doctorId", filters.doctorId);
  if (filters?.date) params.set("date", filters.date);
  if (filters?.patientId) params.set("patientId", filters.patientId);
  const qs = params.toString();
  return apiFetch<Appointment[]>(`/appointments${qs ? `?${qs}` : ""}`);
}

export async function createAppointment(data: CreateAppointmentInput): Promise<Appointment> {
  return apiFetch<Appointment>("/appointments", { method: "POST", body: JSON.stringify(data) });
}

export async function updateAppointmentStatus(id: string, status: string): Promise<Appointment> {
  return apiFetch<Appointment>(`/appointments/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export async function fetchDoctorSlots(doctorId: string, date: string): Promise<{ slots: { time: string; available: boolean }[]; available: boolean }> {
  return apiFetch(`/doctor-schedules/slots?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`);
}

export async function searchMedicines(q: string): Promise<{ id: string; brandName: string; genericName: string; strength: string }[]> {
  return apiFetch(`/medicine-catalog?search=${encodeURIComponent(q)}`);
}

export async function searchPatients(q: string): Promise<any[]> {
  return apiFetch(`/patients?search=${encodeURIComponent(q)}`);
}

export async function createBill(data: {
  patientId: string | null;
  items: { itemType: string; itemName: string; quantity: number; unitPrice: number }[];
  discount: number;
  paymentMethod: PaymentMethod;
}): Promise<Bill> {
  return apiFetch<Bill>("/billing", { method: "POST", body: JSON.stringify(data) });
}

export async function fetchBills(): Promise<Bill[]> {
  return apiFetch<Bill[]>("/billing");
}

export async function updateBillStatus(id: string, status: string): Promise<Bill> {
  return apiFetch<Bill>(`/billing/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}
