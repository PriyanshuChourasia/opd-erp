import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCreatePatient, useUpdatePatient } from "../data/hooks";
import type { Patient } from "../data/interface";
import { uploadDocument, createPatientVitals } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddressManager } from "@/modules/addresses/components/address-manager";
import { DocumentManager } from "@/modules/documents/components/document-manager";
import { Camera, FileUp, X, File, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface PendingFile {
  file: File;
  label: string;
  documentType: string;
  preview?: string;
}

const emptyForm = {
  firstName: "",
  middleName: "",
  lastName: "",
  contactNo: "",
  altContactNo: "",
  email: "",
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  address: "",
  emergencyContact: "",
};

const emptyVitals = {
  heightCm: "",
  weightKg: "",
  temperatureC: "",
  pulseBpm: "",
  systolicBp: "",
  diastolicBp: "",
  spo2Percent: "",
  respiratoryRate: "",
};

interface PatientFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPatient?: Patient | null;
  defaultFirstName?: string;
  defaultLastName?: string;
  defaultContactNo?: string;
  onSaved?: (patient: Patient) => void;
}

export function PatientFormSheet({ open, onOpenChange, editingPatient, defaultFirstName, defaultLastName, defaultContactNo, onSaved }: PatientFormSheetProps) {
  const [form, setForm] = useState(emptyForm);
  const [vitals, setVitals] = useState(emptyVitals);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    setPendingFiles([]);
    setVitals(emptyVitals);
    setForm(
      editingPatient
        ? {
            firstName: editingPatient.firstName,
            middleName: editingPatient.middleName ?? "",
            lastName: editingPatient.lastName,
            contactNo: editingPatient.contactNo,
            altContactNo: editingPatient.altContactNo ?? "",
            email: editingPatient.email ?? "",
            dateOfBirth: editingPatient.dateOfBirth?.slice(0, 10) ?? "",
            gender: editingPatient.gender ?? "",
            bloodGroup: editingPatient.bloodGroup ?? "",
            address: editingPatient.address ?? "",
            emergencyContact: editingPatient.emergencyContact ?? "",
          }
        : { ...emptyForm, firstName: defaultFirstName ?? "", lastName: defaultLastName ?? "", contactNo: defaultContactNo ?? "" },
    );
  }, [open, editingPatient, defaultFirstName, defaultLastName, defaultContactNo]);

  const createMutation = useCreatePatient();
  const updateMutation = useUpdatePatient();

  const uploadPendingDocs = async (patientId: string) => {
    for (const pf of pendingFiles) {
      try {
        await uploadDocument(pf.file, pf.documentType, "Patient", patientId, { caption: pf.label || undefined, isPrimary: pf.documentType === "PROFILE_PHOTO" });
      } catch {
        // errors shown per-file
      }
    }
    if (pendingFiles.length > 0) {
      queryClient.invalidateQueries({ queryKey: ["documents", "Patient", patientId] });
    }
  };

  async function submitVitals(patientId: string) {
    // Only submit if at least one vitals field has a value
    const hasVitals = Object.values(vitals).some((v) => v !== "");
    if (!hasVitals) return;

    const payload: Record<string, string | number> = { patientId };
    if (vitals.heightCm) payload.heightCm = parseFloat(vitals.heightCm);
    if (vitals.weightKg) payload.weightKg = parseFloat(vitals.weightKg);
    if (vitals.temperatureC) payload.temperatureC = parseFloat(vitals.temperatureC);
    if (vitals.pulseBpm) payload.pulseBpm = parseInt(vitals.pulseBpm, 10);
    if (vitals.systolicBp) payload.systolicBp = parseInt(vitals.systolicBp, 10);
    if (vitals.diastolicBp) payload.diastolicBp = parseInt(vitals.diastolicBp, 10);
    if (vitals.spo2Percent) payload.spo2Percent = parseFloat(vitals.spo2Percent);
    if (vitals.respiratoryRate) payload.respiratoryRate = parseInt(vitals.respiratoryRate, 10);

    try {
      await createPatientVitals(payload as any);
    } catch {
      // vitals submission failure shouldn't block patient save
    }
  }

  function handleSave() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.contactNo.trim()) return;
    if (editingPatient) {
      updateMutation.mutate(
        { id: editingPatient.id, data: form },
        { onSuccess: (patient) => { onOpenChange(false); onSaved?.(patient); } },
      );
    } else {
      createMutation.mutate(form as any, {
        onSuccess: async (patient: any) => {
          const saved: Patient = patient?.data ?? patient;
          await uploadPendingDocs(saved.id);
          await submitVitals(saved.id);
          onOpenChange(false);
          onSaved?.({ ...saved, firstName: form.firstName, lastName: form.lastName, contactNo: form.contactNo });
        },
      });
    }
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10 MB"); return; }
    const preview = URL.createObjectURL(file);
    setPendingFiles((prev) => [...prev, { file, label: "Profile Photo", documentType: "PROFILE_PHOTO", preview }]);
    e.target.value = "";
  }

  function handleDocSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is over 10 MB, skipped`); continue; }
      const isImage = file.type.startsWith("image/");
      setPendingFiles((prev) => [...prev, { file, label: "", documentType: isImage ? "OTHER" : "MEDICAL_RECORD" }]);
    }
    e.target.value = "";
  }

  function removePending(index: number) {
    setPendingFiles((prev) => {
      const removed = prev[index];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function updatePendingLabel(index: number, label: string) {
    setPendingFiles((prev) => prev.map((f, i) => i === index ? { ...f, label } : f));
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[90vw] max-w-[1200px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editingPatient ? "Edit Patient" : "Register Patient"}</SheetTitle>
          <SheetDescription>
            {editingPatient ? "Update patient details, photo, and documents below." : "Register a new patient. Add photo and documents below."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-4 px-4 pb-4">
          <FieldGroup>
            {/* Profile Photo + Name in same row */}
            <div className="flex gap-4 items-start border-t pt-3 mt-2">
              <div className="shrink-0">
                {editingPatient?.id ? (
                  <DocumentManager
                    documentableType="Patient"
                    documentableId={editingPatient.id}
                    documentType="PROFILE_PHOTO"
                    label="Profile Photo"
                  />
                ) : (
                  <PendingDocumentSection
                    pendingFiles={pendingFiles}
                    fileInputRef={fileInputRef}
                    docInputRef={docInputRef}
                    onPhotoSelect={handlePhotoSelect}
                    onDocSelect={handleDocSelect}
                    onRemove={removePending}
                    onUpdateLabel={updatePendingLabel}
                  />
                )}
              </div>
              <div className="flex-1 grid grid-cols-3 gap-3">
                <Field>
                  <FieldLabel htmlFor="p-firstName">First Name *</FieldLabel>
                  <Input id="p-firstName" placeholder="Jane" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="p-middleName">Middle</FieldLabel>
                  <Input id="p-middleName" placeholder="M" value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="p-lastName">Last Name *</FieldLabel>
                  <Input id="p-lastName" placeholder="Doe" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </Field>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <Field>
                <FieldLabel htmlFor="p-contactNo">Contact No *</FieldLabel>
                <Input id="p-contactNo" placeholder="+1 555-000-0000" value={form.contactNo} onChange={(e) => setForm({ ...form, contactNo: e.target.value })} />
              </Field>
              <Field>
                <FieldLabel htmlFor="p-altContactNo">Alt Contact</FieldLabel>
                <Input id="p-altContactNo" placeholder="+1 555-000-0001" value={form.altContactNo} onChange={(e) => setForm({ ...form, altContactNo: e.target.value })} />
              </Field>
              <Field>
                <FieldLabel htmlFor="p-email">Email</FieldLabel>
                <Input id="p-email" type="email" placeholder="jane@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field>
                <FieldLabel htmlFor="p-emergency">Emergency Contact</FieldLabel>
                <Input id="p-emergency" placeholder="+1 555-000-0000" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field>
                <FieldLabel htmlFor="p-dob">Date of Birth</FieldLabel>
                <Input id="p-dob" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
              </Field>
              <Field>
                <FieldLabel htmlFor="p-gender">Gender</FieldLabel>
                <select
                  id="p-gender"
                  className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="p-blood">Blood Group</FieldLabel>
                <select
                  id="p-blood"
                  className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm"
                  value={form.bloodGroup}
                  onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                >
                  <option value="">Select...</option>
                  <option value="A+">A+</option><option value="A-">A-</option>
                  <option value="B+">B+</option><option value="B-">B-</option>
                  <option value="O+">O+</option><option value="O-">O-</option>
                  <option value="AB+">AB+</option><option value="AB-">AB-</option>
                </select>
              </Field>
            </div>
            {editingPatient?.id ? (
              <div className="border-t pt-3 mt-2">
                <AddressManager addressableType="Patient" addressableId={editingPatient.id} />
              </div>
            ) : (
              <div className="border-t pt-3 mt-2">
                <p className="text-xs text-muted-foreground">Save the patient first to add addresses.</p>
              </div>
            )}


            {/* ── Patient Vitals (create only — immutable once created) ── */}
            {!editingPatient && (
            <div className="border-t pt-3 mt-2">
              <p className="text-base font-semibold mb-3">Patient Vitals <span className="text-xs font-normal text-muted-foreground">(optional)</span></p>
              <div className="grid grid-cols-2 gap-3">
                <Field>                  <FieldLabel htmlFor="v-height">Height (cm) <span className="text-[10px] font-normal text-muted-foreground">(1 ft = 30.48 cm)</span></FieldLabel>
                   <Input id="v-height" type="number" step="0.1" placeholder="170" value={vitals.heightCm} onChange={(e) => setVitals({ ...vitals, heightCm: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="v-weight">Weight (kg)</FieldLabel>
                  <Input id="v-weight" type="number" step="0.1" placeholder="65" value={vitals.weightKg} onChange={(e) => setVitals({ ...vitals, weightKg: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="v-temp">Temperature (°C)</FieldLabel>
                  <Input id="v-temp" type="number" step="0.1" placeholder="36.5" value={vitals.temperatureC} onChange={(e) => setVitals({ ...vitals, temperatureC: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="v-pulse">Pulse (bpm)</FieldLabel>
                  <Input id="v-pulse" type="number" placeholder="72" value={vitals.pulseBpm} onChange={(e) => setVitals({ ...vitals, pulseBpm: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="v-systolic">Systolic BP <span className="text-[10px] font-normal text-muted-foreground">(heart contracts)</span></FieldLabel>
                  <Input id="v-systolic" type="number" placeholder="120" value={vitals.systolicBp} onChange={(e) => setVitals({ ...vitals, systolicBp: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="v-diastolic">Diastolic BP <span className="text-[10px] font-normal text-muted-foreground">(heart relaxes)</span></FieldLabel>
                  <Input id="v-diastolic" type="number" placeholder="80" value={vitals.diastolicBp} onChange={(e) => setVitals({ ...vitals, diastolicBp: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="v-spo2">SpO₂ (%)</FieldLabel>
                  <Input id="v-spo2" type="number" step="0.1" placeholder="98" value={vitals.spo2Percent} onChange={(e) => setVitals({ ...vitals, spo2Percent: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="v-rr">Respiratory Rate</FieldLabel>
                  <Input id="v-rr" type="number" placeholder="16" value={vitals.respiratoryRate} onChange={(e) => setVitals({ ...vitals, respiratoryRate: e.target.value })} />
                </Field>
              </div>
            </div>
            )}

          </FieldGroup>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.firstName.trim() || !form.lastName.trim() || !form.contactNo.trim() || isPending}>
            {editingPatient ? "Save Changes" : "Register Patient"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Pending files section (add mode — no patient ID yet) ───


function PendingDocumentSection({
  pendingFiles,
  fileInputRef,
  docInputRef,
  onPhotoSelect,
  onDocSelect,
  onRemove,
  onUpdateLabel,
}: {
  pendingFiles: PendingFile[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  docInputRef: React.RefObject<HTMLInputElement | null>;
  onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDocSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  onUpdateLabel: (index: number, label: string) => void;
}) {
  return (
    <div className="border-t pt-3 mt-2 space-y-3">
      <p className="text-xs font-medium text-muted-foreground">Profile Photo & Documents</p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()}>
          <Camera className="size-3.5" /> Photo
        </Button>
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => docInputRef.current?.click()}>
          <FileUp className="size-3.5" /> Document
        </Button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPhotoSelect} />
        <input ref={docInputRef} type="file" accept="image/*,.pdf,.doc,.docx" multiple className="hidden" onChange={onDocSelect} />
      </div>
      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          {pendingFiles.map((pf, i) => (
            <div key={i} className="flex items-center gap-2 rounded-none border px-3 py-2 text-sm">
              {pf.preview ? (
                <img src={pf.preview} alt="" className="size-8 rounded object-cover" />
              ) : pf.file.type.startsWith("image/") ? (
                <ImageIcon className="size-4 text-muted-foreground" />
              ) : (
                <File className="size-4 text-muted-foreground" />
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs">{pf.file.name}</p>
                <Input
                  placeholder="Label (optional)"
                  className="mt-1 h-7 text-xs"
                  value={pf.label}
                  onChange={(e) => onUpdateLabel(i, e.target.value)}
                />
              </div>
              <button type="button" onClick={() => onRemove(i)} className="shrink-0 text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
