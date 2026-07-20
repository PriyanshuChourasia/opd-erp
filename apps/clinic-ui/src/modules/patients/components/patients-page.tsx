import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
  Droplets,
  Camera,
  FileUp,
  FileText,
} from "lucide-react";
import { fetchPatients, fetchPatient, createPatient, updatePatient, deletePatient, fetchDocumentsByEntity, uploadDocument, deleteDocument, type Patient, type CreatePatientInput, type DocumentRecord } from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { DataTable } from "@/components/data-table/data-table";
import { DocumentManager } from "@/modules/documents/components/document-manager";
import { DocumentGallery } from "@/modules/documents/components/document-viewer";
import { AddressManager } from "@/modules/addresses/components/address-manager";
import { AllergySelect } from "@/components/allergy-select";

const bloodGroupColors: Record<string, string> = {
  "A+": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "A-": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "B+": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "B-": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "O+": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "O-": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "AB+": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "AB-": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

function PatientAvatar({ patientId, name }: { patientId: string; name: string }) {
  const { data: docs } = useQuery({
    queryKey: ["documents", "Patient", patientId],
    queryFn: () => fetchDocumentsByEntity("Patient", patientId),
    enabled: !!patientId,
    staleTime: 60_000,
  });
  const photo = docs?.find((d) => d.documentType === "PROFILE_PHOTO" && d.isActive);

  if (photo) {
    return (
      <img
        src={`/uploads/documents/${photo.fileName}`}
        alt={name}
        className="size-8 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
      <Users className="size-3.5 text-primary" />
    </span>
  );
}

export function PatientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Documents sheet state
  const [docSheetOpen, setDocSheetOpen] = useState(false);
  const [docSheetPatient, setDocSheetPatient] = useState<Patient | null>(null);

  // Pending files for add mode
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<CreatePatientInput>({
    name: "", phone: "", email: "", dateOfBirth: "", gender: "", bloodGroup: "", address: "", emergencyContact: "", allergies: [], isFollowUp: false,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["patients", search, pagination.pageIndex, pagination.pageSize],
    queryFn: () => fetchPatients({
      search: search || undefined,
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
    }),
    placeholderData: (previous) => previous,
  });

  const patients = response?.data ?? [];
  const pageCount = response?.meta?.totalPages ?? 0;

  const createMutation = useMutation({
    mutationFn: createPatient,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["patients"] }); closeSheet(); toast.success("Patient created successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePatientInput> }) => updatePatient(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["patients"] }); closeSheet(); toast.success("Patient updated successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePatient,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["patients"] }); setDeleteConfirm(null); toast.success("Patient deactivated successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  function openAdd() {
    setEditingId(null);
    setPendingFiles([]);
    setForm({ name: "", phone: "", email: "", dateOfBirth: "", gender: "", bloodGroup: "", address: "", emergencyContact: "", allergies: [], isFollowUp: false });
    setSheetOpen(true);
  }

  async function openEdit(id: string) {
    setEditingId(id);
    setPendingFiles([]);
    const patient = await queryClient.fetchQuery({ queryKey: ["patient", id], queryFn: () => fetchPatient(id) });
    setForm({
      name: patient.name, phone: patient.phone, email: patient.email ?? "", dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split("T")[0] ?? "" : "",
      gender: patient.gender ?? "", bloodGroup: patient.bloodGroup ?? "", address: patient.address ?? "", emergencyContact: patient.emergencyContact ?? "",
      allergies: patient.allergies ?? [], isFollowUp: patient.isFollowUp ?? false,
    });
    setSheetOpen(true);
  }

  function openDocs(patient: Patient) {
    setDocSheetPatient(patient);
    setDocSheetOpen(true);
  }

  function closeSheet() { setSheetOpen(false); setEditingId(null); setPendingFiles([]); }

  // Upload pending files after patient creation
  const uploadPendingDocs = async (patientId: string) => {
    for (const pf of pendingFiles) {
      try {
        await uploadDocument(pf.file, pf.documentType, "Patient", patientId, { caption: pf.label || undefined, isPrimary: pf.documentType === "PROFILE_PHOTO" });
      } catch { /* toast per file */ }
    }
    if (pendingFiles.length > 0) {
      queryClient.invalidateQueries({ queryKey: ["documents", "Patient", patientId] });
    }
  };

  function handleSave() {
    if (!form.name.trim() || !form.phone.trim()) return;
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form, {
        onSuccess: async (patient: Patient) => {
          await uploadPendingDocs(patient.id);
          queryClient.invalidateQueries({ queryKey: ["patients"] });
          closeSheet();
          toast.success("Patient created successfully");
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

  const photoPending = pendingFiles.filter((f) => f.documentType === "PROFILE_PHOTO");
  const otherPending = pendingFiles.filter((f) => f.documentType !== "PROFILE_PHOTO");

  const columns = useMemo<ColumnDef<Patient>[]>(() => [
    {
      accessorKey: "name",
      header: "Patient",
      cell: ({ row }) => {
        const patient = row.original;
        return (
          <div className="flex items-center gap-3">
            <PatientAvatar patientId={patient.id} name={patient.name} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate font-medium">{patient.name}</p>
                {patient.isFollowUp && <Badge variant="outline" className="shrink-0 text-[10px] text-blue-700 dark:text-blue-400">Follow-up</Badge>}
              </div>
              {patient.gender && <p className="text-xs text-muted-foreground">{patient.gender}</p>}
            </div>
          </div>
        );
      },
    },
    {
      id: "contact",
      header: "Contact",
      cell: ({ row }) => {
        const patient = row.original;
        return (
          <div className="text-xs text-muted-foreground">
            <p>{patient.phone}</p>
            {patient.email && <p>{patient.email}</p>}
          </div>
        );
      },
    },
    {
      accessorKey: "dateOfBirth",
      header: "Date of birth",
      cell: ({ row }) => {
        const dob = row.original.dateOfBirth;
        return dob ? new Date(dob).toLocaleDateString() : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      accessorKey: "bloodGroup",
      header: "Blood group",
      cell: ({ row }) => {
        const bloodGroup = row.original.bloodGroup;
        if (!bloodGroup) return <span className="text-muted-foreground">—</span>;
        return (
          <Badge variant="outline" className={`text-[10px] uppercase ${bloodGroupColors[bloodGroup] ?? ""}`}>
            <Droplets className="mr-1 size-2.5" />{bloodGroup}
          </Badge>
        );
      },
    },
    {
      id: "allergies",
      header: "Allergies",
      cell: ({ row }) => {
        const allergies = row.original.allergies ?? [];
        if (allergies.length === 0) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {allergies.map((a) => (
              <span key={a} className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">{a}</span>
            ))}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const patient = row.original;
        return (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" className="size-8" title="Documents" onClick={() => openDocs(patient)}>
              <FileText className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(patient.id)}>
              <Pencil className="size-3.5" />
            </Button>
            {deleteConfirm === patient.id ? (
              <div className="flex items-center gap-1">
                <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => deleteMutation.mutate(patient.id)}>Deactivate</Button>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => setDeleteConfirm(null)}><X className="size-3.5" /></Button>
              </div>
            ) : (
              <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(patient.id)}>
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        );
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [deleteConfirm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
          <p className="mt-1 text-sm text-muted-foreground">Register, search, and manage patient records</p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button onClick={openAdd}><Plus className="mr-2 size-4" />Add Patient</Button>
          </SheetTrigger>
          <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingId ? "Edit Patient" : "Add Patient"}</SheetTitle>
              <SheetDescription>{editingId ? "Update patient details, photo, and documents." : "Register a new patient. Add photo and documents below (optional)."}</SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-4 px-4 pb-4">
              <FieldGroup>
                {/* ── Photo & Documents ── */}
                {editingId ? (
                  <div className="border-t pt-3 mt-2 space-y-4">
                    <DocumentManager documentableType="Patient" documentableId={editingId} documentType="PROFILE_PHOTO" label="Profile Photo" />
                    <div className="border-t pt-3">
                      <p className="text-sm font-medium mb-2">Documents & Images <span className="text-xs font-normal text-muted-foreground">(Optional)</span></p>
                      <DocumentUploaderInline patientId={editingId} />
                    </div>
                  </div>
                ) : (
                  <div className="border-t pt-3 mt-2 space-y-3">
                    {/* Photo preview */}
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => photoInputRef.current?.click()}
                        className="flex size-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted/50 transition-colors hover:border-primary/50 hover:bg-muted shrink-0">
                        {photoPending[0]?.preview ? (
                          <img src={photoPending[0].preview} alt="Photo" className="size-full object-cover" />
                        ) : (
                          <Camera className="size-6 text-muted-foreground/50" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Profile Photo</p>
                        <p className="text-xs text-muted-foreground">{photoPending[0] ? photoPending[0].file.name : "Click to select a photo"}</p>
                      </div>
                      <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handlePhotoSelect} />
                    </div>
                    {/* Documents */}
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Documents & Images <span className="text-xs font-normal text-muted-foreground">(Optional)</span></p>
                        <Button type="button" variant="outline" size="sm" onClick={() => docInputRef.current?.click()}>
                          <FileUp className="mr-1.5 size-3.5" /> Add File
                        </Button>
                        <input ref={docInputRef} type="file" accept="image/*,application/pdf,.doc,.docx" multiple className="hidden" onChange={handleDocSelect} />
                      </div>
                      {otherPending.length === 0 && (
                        <p className="text-xs text-muted-foreground">No documents added yet. You can add them now or later.</p>
                      )}
                      <div className="space-y-2">
                        {otherPending.map((pf) => {
                          const realIdx = pendingFiles.indexOf(pf);
                          const isImage = pf.file.type.startsWith("image/");
                          return (
                            <div key={realIdx} className="flex items-center gap-2 rounded-none border p-2">
                              {isImage && pf.preview ? (
                                <img src={pf.preview} alt="" className="size-10 shrink-0 rounded object-cover" />
                              ) : (
                                <span className="flex size-10 shrink-0 items-center justify-center rounded bg-muted">
                                  <FileUp className="size-5 text-muted-foreground" />
                                </span>
                              )}
                              <div className="flex-1 min-w-0 space-y-1">
                                <p className="text-xs truncate text-muted-foreground">{pf.file.name}</p>
                                <Input placeholder="Label (e.g. Aadhaar Card, Prescription)" className="h-7 text-xs" value={pf.label} onChange={(e) => updatePendingLabel(realIdx, e.target.value)} />
                              </div>
                              <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => removePending(realIdx)}>
                                <X className="size-3.5" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <Field><FieldLabel htmlFor="p-name">Full Name *</FieldLabel><Input id="p-name" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <Field><FieldLabel htmlFor="p-phone">Phone *</FieldLabel><Input id="p-phone" placeholder="+1 555-000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
                <Field><FieldLabel htmlFor="p-email">Email</FieldLabel><Input id="p-email" type="email" placeholder="john@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <div className="flex gap-3">
                  <Field className="flex-1"><FieldLabel htmlFor="p-dob">Date of Birth</FieldLabel><Input id="p-dob" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></Field>
                  <Field className="flex-1"><FieldLabel htmlFor="p-gender">Gender</FieldLabel>
                    <select id="p-gender" className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                      <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                    </select>
                  </Field>
                </div>
                <Field><FieldLabel htmlFor="p-blood">Blood Group</FieldLabel>
                  <select id="p-blood" className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                    <option value="">Select</option>
                    {Object.keys(bloodGroupColors).map((bg) => (<option key={bg} value={bg}>{bg}</option>))}
                  </select>
                </Field>
                <Field><FieldLabel htmlFor="p-emergency">Emergency Contact</FieldLabel><Input id="p-emergency" placeholder="+1 555-000-0001" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} /></Field>
                {editingId ? (
                  <div className="border-t pt-3 mt-2">
                    <AddressManager addressableType="Patient" addressableId={editingId} />
                  </div>
                ) : (
                  <div className="border-t pt-3 mt-2">
                    <p className="text-xs text-muted-foreground">Save the patient first to add addresses.</p>
                  </div>
                )}
                <Field><FieldLabel htmlFor="p-allergies">Allergies</FieldLabel><AllergySelect value={form.allergies ?? []} onChange={(allergies) => setForm({ ...form, allergies })} /></Field>
                <Field>
                  <label htmlFor="p-follow-up" className="flex w-fit items-center gap-2 text-sm">
                    <input id="p-follow-up" type="checkbox" className="size-4" checked={form.isFollowUp ?? false} onChange={(e) => setForm({ ...form, isFollowUp: e.target.checked })} />
                    Follow-up patient
                  </label>
                </Field>
              </FieldGroup>
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={closeSheet}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.name.trim() || !form.phone.trim() || createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Save Changes" : "Create Patient"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or email..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={patients}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
            emptyState={
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <Users className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">{search ? "No patients found" : "No patients registered yet"}</p>
                <Button size="sm" onClick={openAdd}><Plus className="mr-1.5 size-3.5" />Add Patient</Button>
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* ── Documents Sheet (opened from table actions) ── */}
      <Sheet open={docSheetOpen} onOpenChange={setDocSheetOpen}>
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Documents — {docSheetPatient?.name}</SheetTitle>
            <SheetDescription>Upload, view, and manage documents for this patient.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4 space-y-4">
            {docSheetPatient?.id && (
              <>
                <DocumentManager documentableType="Patient" documentableId={docSheetPatient.id} documentType="PROFILE_PHOTO" label="Profile Photo" />
                <div className="border-t pt-3">
                  <p className="text-sm font-medium mb-2">Upload Documents <span className="text-xs font-normal text-muted-foreground">(Optional)</span></p>
                  <DocumentUploaderInline patientId={docSheetPatient.id} />
                </div>
                <div className="border-t pt-3">
                  <DocumentGallery documentableType="Patient" documentableId={docSheetPatient.id} />
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ── Inline document uploader for edit mode (has patient ID) ──

function DocumentUploaderInline({ patientId }: { patientId: string }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<{ file: File; label: string; preview?: string }[]>([]);

  const { data: docs = [] } = useQuery({
    queryKey: ["documents", "Patient", patientId],
    queryFn: () => fetchDocumentsByEntity("Patient", patientId),
    enabled: !!patientId,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, caption }: { file: File; caption?: string }) =>
      uploadDocument(file, file.type.startsWith("image/") ? "OTHER" : "MEDICAL_RECORD", "Patient", patientId, { caption }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["documents", "Patient", patientId] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["documents", "Patient", patientId] }); toast.success("Document removed"); },
  });

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is over 10 MB, skipped`); continue; }
      const isImage = file.type.startsWith("image/");
      const preview = isImage ? URL.createObjectURL(file) : undefined;
      setPendingFiles((prev) => [...prev, { file, label: "", preview }]);
    }
    e.target.value = "";
  }

  function removePending(index: number) {
    setPendingFiles((prev) => { const r = prev[index]; if (r?.preview) URL.revokeObjectURL(r.preview); return prev.filter((_, i) => i !== index); });
  }

  function updatePendingLabel(index: number, label: string) {
    setPendingFiles((prev) => prev.map((f, i) => i === index ? { ...f, label } : f));
  }

  async function uploadAll() {
    if (pendingFiles.length === 0) return;
    let ok = 0;
    for (const pf of pendingFiles) {
      try {
        await uploadMutation.mutateAsync({ file: pf.file, caption: pf.label || undefined });
        ok++;
      } catch { /* toast per file */ }
    }
    for (const pf of pendingFiles) { if (pf.preview) URL.revokeObjectURL(pf.preview); }
    setPendingFiles([]);
    if (ok > 0) toast.success(`${ok} document${ok === 1 ? "" : "s"} uploaded`);
  }

  const nonPhotoDocs = docs.filter((d) => d.documentType !== "PROFILE_PHOTO" && d.isActive);

  return (
    <div className="space-y-3">
      {nonPhotoDocs.map((doc) => (
        <div key={doc.id} className="flex items-center gap-2 rounded-none border p-2">
          {doc.mimeType.startsWith("image/") ? (
            <img src={`/uploads/documents/${doc.fileName}`} alt="" className="size-10 shrink-0 rounded object-cover" />
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded bg-muted">
              <FileText className="size-5 text-muted-foreground" />
            </span>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{doc.originalName}</p>
            <p className="text-[10px] text-muted-foreground">{doc.caption || doc.documentType} · {(doc.fileSize / 1024).toFixed(0)} KB</p>
          </div>
          <Button variant="ghost" size="icon" className="size-7 shrink-0 text-destructive" onClick={() => deleteMutation.mutate(doc.id)}>
            <X className="size-3.5" />
          </Button>
        </div>
      ))}

      {pendingFiles.map((pf, idx) => (
        <div key={idx} className="flex items-center gap-2 rounded-none border p-2">
          {pf.preview ? (
            <img src={pf.preview} alt="" className="size-10 shrink-0 rounded object-cover" />
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded bg-muted">
              <FileUp className="size-5 text-muted-foreground" />
            </span>
          )}
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-xs truncate text-muted-foreground">{pf.file.name}</p>
            <Input placeholder="Label (e.g. Aadhaar Card, Prescription)" className="h-7 text-xs" value={pf.label} onChange={(e) => updatePendingLabel(idx, e.target.value)} />
          </div>
          <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => removePending(idx)}>
            <X className="size-3.5" />
          </Button>
        </div>
      ))}

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <FileUp className="mr-1.5 size-3.5" /> Add File
        </Button>
        {pendingFiles.length > 0 && (
          <Button type="button" size="sm" onClick={uploadAll} disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? "Uploading..." : `Upload ${pendingFiles.length} file${pendingFiles.length === 1 ? "" : "s"}`}
          </Button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.doc,.docx" multiple className="hidden" onChange={handleFileSelect} />
      </div>
      {nonPhotoDocs.length === 0 && pendingFiles.length === 0 && (
        <p className="text-xs text-muted-foreground">No documents yet. Click "Add File" to upload files.</p>
      )}
    </div>
  );
}

interface PendingFile {
  file: File;
  label: string;
  documentType: string;
  preview?: string;
}
