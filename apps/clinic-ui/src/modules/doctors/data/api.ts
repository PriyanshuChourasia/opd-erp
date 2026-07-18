import { apiFetch, type Doctor, type CreateDoctorInput, type EmployeeSchedule } from "@/lib/api";
import type { EmployeeScheduleDay } from "./interface";

export async function fetchDoctors(search?: string) {
  const url = search ? `/doctors?search=${encodeURIComponent(search)}` : "/doctors";
  return apiFetch<{ data: Doctor[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(url);
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

export async function fetchDoctorSchedules(doctorId: string): Promise<EmployeeScheduleDay[]> {
  const res = await apiFetch<EmployeeSchedule[]>(`/employee-schedules?employeeSchedulableType=Doctor&employeeSchedulableId=${encodeURIComponent(doctorId)}`);
  return res.map((s) => ({
    id: s.id,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    shiftId: s.shiftId,
    shift: s.shift,
  }));
}

export async function createEmployeeSchedule(data: {
  employeeSchedulableType: string;
  employeeSchedulableId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  shiftId?: string;
}): Promise<EmployeeScheduleDay> {
  const res = await apiFetch<EmployeeSchedule>("/employee-schedules", { method: "POST", body: JSON.stringify(data) });
  return { id: res.id, dayOfWeek: res.dayOfWeek, startTime: res.startTime, endTime: res.endTime, shiftId: res.shiftId, shift: res.shift };
}

export async function updateEmployeeSchedule(id: string, data: {
  employeeSchedulableType: string;
  employeeSchedulableId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  shiftId?: string;
}): Promise<EmployeeScheduleDay> {
  const res = await apiFetch<EmployeeSchedule>(`/employee-schedules/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  return { id: res.id, dayOfWeek: res.dayOfWeek, startTime: res.startTime, endTime: res.endTime, shiftId: res.shiftId, shift: res.shift };
}

export async function deleteEmployeeSchedule(id: string): Promise<void> {
  return apiFetch<void>(`/employee-schedules/${id}`, { method: "DELETE" });
}
