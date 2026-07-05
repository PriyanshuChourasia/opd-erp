import { apiFetch, type Doctor, type CreateDoctorInput } from "@/lib/api";
import type { DoctorScheduleDay } from "./interface";

export async function fetchDoctors(search?: string): Promise<Doctor[]> {
  const url = search ? `/doctors?search=${encodeURIComponent(search)}` : "/doctors";
  return apiFetch<Doctor[]>(url);
}

export async function fetchDoctor(id: string): Promise<Doctor> {
  return apiFetch<Doctor>(`/doctors/${id}`);
}

export async function createDoctor(data: CreateDoctorInput): Promise<Doctor> {
  return apiFetch<Doctor>("/doctors", { method: "POST", body: JSON.stringify(data) });
}

export async function updateDoctor(id: string, data: Partial<CreateDoctorInput>): Promise<Doctor> {
  return apiFetch<Doctor>(`/doctors/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteDoctor(id: string): Promise<void> {
  return apiFetch<void>(`/doctors/${id}`, { method: "DELETE" });
}

export async function fetchDoctorSchedules(doctorId: string): Promise<DoctorScheduleDay[]> {
  return apiFetch<DoctorScheduleDay[]>(`/doctor-schedules?doctorId=${encodeURIComponent(doctorId)}`);
}

export async function upsertDoctorSchedule(data: {
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  maxPatients: number;
}): Promise<DoctorScheduleDay> {
  return apiFetch<DoctorScheduleDay>("/doctor-schedules", { method: "POST", body: JSON.stringify(data) });
}

export async function deleteDoctorSchedule(id: string): Promise<void> {
  return apiFetch<void>(`/doctor-schedules/${id}`, { method: "DELETE" });
}
