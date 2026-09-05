import type { Prescription } from "@/lib/api";
import { getPatientName } from "@/lib/api";
import type { RxDocData, RxDocItem } from "./rx-types";

interface OrgInfo {
  phone?: string | null;
  email?: string | null;
}

interface RxSourcePerson {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  contactNo?: string;
  email?: string | null;
}

interface RxSourceDoctor {
  name?: string | null;
  medicalRegistrationNo?: string;
  qualification?: string | null;
  specialization?: string | null;
}

function mapDoctor(doctor: RxSourceDoctor | null | undefined, fallback: string): string {
  return doctor?.name ?? doctor?.medicalRegistrationNo ?? fallback;
}

/** Saved Prescription row → the shared document model. */
export function rxDocFromSavedPrescription(
  rx: Prescription,
  organisation?: OrgInfo | null,
): RxDocData {
  const dateLabel = new Date(rx.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const doctorName = rx.doctor?.name ?? rx.doctor?.medicalRegistrationNo ?? "Doctor";
  return {
    referenceTitle: "Rx No",
    reference: rx.id.slice(0, 8).toUpperCase(),
    dateLabel,
    regNo: rx.doctor?.medicalRegistrationNo ?? undefined,
    patientName: rx.patient ? getPatientName(rx.patient) : "",
    patientPhone: rx.patient?.contactNo || undefined,
    patientEmail: rx.patient?.email ?? undefined,
    doctorName,
    doctorQualification: rx.doctor?.qualification ?? undefined,
    doctorSpecialization: rx.doctor?.specialization ?? undefined,
    doctorSignatureName: doctorName,
    diagnosis: rx.diagnosis ?? undefined,
    notes: rx.notes ?? undefined,
    items: (rx.items ?? []).map((it) => ({
      medicineId: it.medicineId,
      medicineName: it.medicineName,
      dosage: it.dosage ?? undefined,
      duration: it.duration ?? undefined,
      quantity: it.quantity ?? 1,
      instructions: it.instructions ?? undefined,
    })),
    generatedLabel: "Computer-generated prescription",
    orgPhone: organisation?.phone ?? undefined,
    orgEmail: organisation?.email ?? undefined,
  };
}

/**
 * Pre-save prescription (from the create/edit page's form state) → the same
 * shared document model, so preview-before-save and the saved document render
 * identically.
 */
export function rxDocFromNewPrescription(input: {
  reference: string;
  referenceTitle?: string;
  dateLabel?: string;
  regNo?: string;
  patient: RxSourcePerson | null;
  doctor: RxSourceDoctor | null;
  diagnosis?: string;
  notes?: string;
  items?: RxDocItem[];
  organisation?: OrgInfo | null;
}): RxDocData {
  const patientName = input.patient ? getPatientName(input.patient) : "";
  const doctorName = mapDoctor(input.doctor, "Doctor");
  return {
    referenceTitle: input.referenceTitle ?? "Rx No",
    reference: input.reference,
    dateLabel: input.dateLabel ?? new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
    regNo: input.regNo,
    patientName,
    patientPhone: input.patient?.contactNo || undefined,
    patientEmail: input.patient?.email ?? undefined,
    doctorName,
    doctorQualification: input.doctor?.qualification ?? undefined,
    doctorSpecialization: input.doctor?.specialization ?? undefined,
    doctorSignatureName: doctorName,
    diagnosis: input.diagnosis || undefined,
    notes: input.notes || undefined,
    items: input.items ?? [],
    generatedLabel: "Computer-generated prescription",
    orgPhone: input.organisation?.phone ?? undefined,
    orgEmail: input.organisation?.email ?? undefined,
  };
}
