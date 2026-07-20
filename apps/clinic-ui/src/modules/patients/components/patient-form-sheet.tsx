import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCreatePatient, useUpdatePatient } from "../data/hooks";
import type { Patient } from "../data/interface";
import { uploadDocument } from "@/lib/api";
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
  name: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  address: "",
  emergencyContact: "",
  isFollowUp: false,
};

interface PatientFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPatient?: Patient | null;
  defaultName?: string;
  defaultPhone?: string;
  onSaved?: (patient: Patient) => void;
}

export function PatientFormSheet({ open, onOpenChange, editingPatient, defaultName, defaultPhone, onSaved }: PatientFormSheetProps) {
  const [form, setForm] = useState(emptyForm);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    setPendingFiles([]);
    setForm(
      editingPatient
        ? {
            name: editingPatient.name,
            phone: editingPatient.phone,
            email: editingPatient.email ?? "",
            dateOfBirth: editingPatient.dateOfBirth?.slice(0, 10) ?? "",
            gender: editingPatient.gender ?? "",
            bloodGroup: editingPatient.bloodGroup ?? "",
            address: editingPatient.address ?? "",
            emergencyContact: editingPatient.emergencyContact ?? "",
            isFollowUp: editingPatient.isFollowUp ?? false,
          }
        : { ...emptyForm, name: defaultName ?? "", phone: defaultPhone ?? "" },
    );
  }, [open, editingPatient, defaultName, defaultPhone]);

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

  function handleSave() {
    if (!form.name.trim() || !form.phone.trim()) return;
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
          onOpenChange(false);
          onSaved?.({ ...saved, name: form.name, phone: form.phone });
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
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editingPatient ? "Edit Patient" : "Register Patient"}</SheetTitle>
          <SheetDescription>
            {editingPatient ? "Update patient details, photo, and documents below." : "Register a new patient. Add photo and documents below."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-4 px-4 pb-4">
          <FieldGroup>
            {/* Profile Photo & Documents */}
            {editingPatient?.id ? (
              <div className="border-t pt-3 mt-2 space-y-4">
                <DocumentManager
                  documentableType="Patient"
                  documentableId={editingPatient.id}
                  documentType="PROFILE_PHOTO"
                  label="Profile Photo"
                />
                <DocumentUploader
                  documentableType="Patient"
                  documentableId={editingPatient.id}
                />
              </div>
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

            <Field>
              <FieldLabel htmlFor="p-name">Full Name *</FieldLabel>
              <Input id="p-name" placeholder="Jane Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel htmlFor="p-phone">Phone *</FieldLabel>
              <Input id="p-phone" placeholder="+1 555-000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel htmlFor="p-email">Email</FieldLabel>
              <Input id="p-email" type="email" placeholder="jane@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <div className="flex gap-3">
              <Field className="flex-1">
                <FieldLabel htmlFor="p-dob">Date of Birth</FieldLabel>
                <Input id="p-dob" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
              </Field>
              <Field className="flex-1">
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
            </div>
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
            {editingPatient?.id ? (
              <div className="border-t pt-3 mt-2">
                <AddressManager addressableType="Patient" addressableId={editingPatient.id} />
              </div>
            ) : (
              <div className="border-t pt-3 mt-2">
                <p className="text-xs text-muted-foreground">Save the patient first to add addresses.</p>
              </div>
            )}
            <Field>
              <FieldLabel htmlFor="p-emergency">Emergency Contact</FieldLabel>
              <Input id="p-emergency" placeholder="+1 555-000-0000" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
            </Field>
            <Field>
              <label htmlFor="p-follow-up" className="flex w-fit items-center gap-2 text-sm">
                <input id="p-follow-up" type="checkbox" className="size-4" checked={form.isFollowUp} onChange={(e) => setForm({ ...form, isFollowUp: e.target.checked })} />
                Follow-up patient
              </label>
            </Field>
          </FieldGroup>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.name.trim() || !form.phone.trim() || isPending}>
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
  const photoPending = pendingFiles.filter((f) => f.documentType === "PROFILE_PHOTO");
  const otherPending = pendingFiles.filter((f) => f.documentType !== "PROFILE_PHOTO");

  return (
    <div className="border-t pt-3 mt-2 space-y-3">
      {/* Profile Photo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex size-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted/50 transition-colors hover:border-primary/50 hover:bg-muted shrink-0"
        >
          {photoPending[0]?.preview ? (
            <img src={photoPending[0].preview} alt="Photo" className="size-full object-cover" />
          ) : (
            <Camera className="size-6 text-muted-foreground/50" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Profile Photo</p>
          <p className="text-xs text-muted-foreground">
            {photoPending[0] ? photoPending[0].file.name : "Click to select a photo"}
          </p>
        </div>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onPhotoSelect} />
      </div>

      {/* Other Documents */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Documents & Images <span className="text-xs font-normal text-muted-foreground">(Optional)</span></p>
            <Button type="button" variant="outline" size="sm" onClick={() => docInputRef.current?.click()}>
              <FileUp className="mr-1.5 size-3.5" /> Add File
            </Button>
            <input ref={docInputRef} type="file" accept="image/*,application/pdf,.doc,.docx" multiple className="hidden" onChange={onDocSelect} />
          </div>

          {otherPending.length === 0 && (
            <p className="text-xs text-muted-foreground">No documents added yet. You can add them now or later.</p>
          )}

        <div className="space-y-2">
          {otherPending.map((pf, idx) => {
            const realIdx = pendingFiles.indexOf(pf);
            const isImage = pf.file.type.startsWith("image/");
            return (
              <div key={realIdx} className="flex items-center gap-2 rounded-none border p-2">
                {isImage && pf.preview ? (
                  <img src={pf.preview} alt="" className="size-10 shrink-0 rounded object-cover" />
                ) : (
                  <span className="flex size-10 shrink-0 items-center justify-center rounded bg-muted">
                    <File className="size-5 text-muted-foreground" />
                  </span>
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-xs truncate text-muted-foreground">{pf.file.name}</p>
                  <Input
                    placeholder="Add a label (e.g. Aadhaar Card, Prescription)"
                    className="h-7 text-xs"
                    value={pf.label}
                    onChange={(e) => onUpdateLabel(realIdx, e.target.value)}
                  />
                </div>
                <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => onRemove(realIdx)}>
                  <X className="size-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Document uploader (edit mode — has patient ID) ─────────

function DocumentUploader({ documentableType, documentableId }: { documentableType: string; documentableId: string }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState("");

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      uploadDocument(file, file.type.startsWith("image/") ? "OTHER" : "MEDICAL_RECORD", documentableType, documentableId, { caption: label || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", documentableType, documentableId] });
      setLabel("");
      toast.success("Document uploaded");
    },
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10 MB"); return; }
    uploadMutation.mutate(file);
    e.target.value = "";
  }

  return (
    <div className="border-t pt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">Documents & Images <span className="text-xs font-normal text-muted-foreground">(Optional)</span></p>
      </div>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Label (e.g. Aadhaar Card, Prescription)"
          className="flex-1 h-8 text-xs"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
          <FileUp className="mr-1.5 size-3.5" />
          {uploadMutation.isPending ? "Uploading..." : "Upload"}
        </Button>
        <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.doc,.docx" className="hidden" onChange={handleChange} />
      </div>
    </div>
  );
}
