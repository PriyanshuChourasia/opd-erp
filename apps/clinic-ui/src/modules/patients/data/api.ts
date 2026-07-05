import { apiFetch, type Patient, type CreatePatientInput } from "@/lib/api";

export async function fetchPatients(search?: string): Promise<Patient[]> {
  const url = search ? `/patients?search=${encodeURIComponent(search)}` : "/patients";
  return apiFetch<Patient[]>(url);
}

export async function fetchPatient(id: string): Promise<Patient> {
  return apiFetch<Patient>(`/patients/${id}`);
}

export async function createPatient(data: CreatePatientInput): Promise<Patient> {
  return apiFetch<Patient>("/patients", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePatient(id: string, data: Partial<CreatePatientInput>): Promise<Patient> {
  return apiFetch<Patient>(`/patients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deletePatient(id: string): Promise<void> {
  return apiFetch<void>(`/patients/${id}`, { method: "DELETE" });
}
