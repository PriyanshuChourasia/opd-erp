import { getPatientName, createPatientVitals } from "@/lib/api";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useNavigate } from "@tanstack/react-router";
import {
  CalendarPlus,
  HeartPulse,
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
import { fetchPatients, fetchPatient, createPatient, updatePatient, deletePatient, fetchDocumentsByEntity, fetchBatchProfilePhotos, uploadDocument, deleteDocument, fetchBloodGroups, type Patient, type CreatePatientInput, type DocumentRecord } from "@/lib/api";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppSelector } from "@/store/hooks";
import { hasPermission } from "@/lib/roles";

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

function PatientAvatar({ photoUrl, name }: { photoUrl?: string; name: string }) {
  if (photoUrl) {
    return (
      <img
        src={`/api/documents/by-name/${photoUrl}/image`}
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const permissions = useAppSelector((state) => state.auth.user?.permissions);
  const canCreate = hasPermission(permissions, "create", "patients");
  const canUpdate = hasPermission(permissions, "update", "patients");
  const canDelete = hasPermission(permissions, "delete", "patients");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Documents sheet state
  const [docSheetOpen, setDocSheetOpen] = useState(false);
  const [docSheetPatient, setDocSheetPatient] = useState<Patient | null>(null);

  // Vitals sheet state
  const [vitalsSheetOpen, setVitalsSheetOpen] = useState(false);
  const [vitalsPatient, setVitalsPatient] = useState<Patient | null>(null);
  const [vitalsForm, setVitalsForm] = useState<Record<string, string>>({
    heightCm: "", weightCm: "", temperatureC: "", pulseBpm: "",
    systolicBp: "", diastolicBp: "", spo2Percent: "", respiratoryRate: "", medicalStatus: "",
  });

  // Pending files for add mode
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<CreatePatientInput>({
    firstName: "", middleName: "", lastName: "", contactNo: "", altContactNo: "", email: "", dateOfBirth: "", gender: "", bloodGroup: "", address: "", emergencyContact: "", allergies: [],
  });

  const { data: bloodGroups = [] } = useQuery({
    queryKey: ["blood-groups"],
    queryFn: () => fetchBloodGroups(),
  });
  const [vitals, setVitals] = useState({
    heightCm: "",
    weightKg: "",
    temperatureC: "",
    pulseBpm: "",
    systolicBp: "",
    diastolicBp: "",
    spo2Percent: "",
    respiratoryRate: "",
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

  // Batch-fetch profile photos for all patients on the current page (1 call instead of N)
  const patientIds = useMemo(() => patients.map((p) => p.id), [patients]);
  const { data: profilePhotos = [] } = useQuery({
    queryKey: ["batch-profile-photos", "Patient", patientIds],
    queryFn: () => fetchBatchProfilePhotos("Patient", patientIds),
    enabled: patientIds.length > 0,
    staleTime: 60_000,
  });
  const photoMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const doc of profilePhotos) {
      if (!map.has(doc.documentableId)) map.set(doc.documentableId, doc.fileName);
    }
    return map;
  }, [profilePhotos]);

  const createMutation = useMutation({
    mutationFn: createPatient,
    onSuccess: async (patient: any) => {
      const saved: Patient = patient?.data ?? patient;
      // Submit vitals if any field has a value
      const hasVitals = Object.values(vitals).some((v) => v !== "");
      if (hasVitals) {
        try {
          const payload: Record<string, string | number> = { patientId: saved.id };
          if (vitals.heightCm) payload.heightCm = parseFloat(vitals.heightCm);
          if (vitals.weightKg) payload.weightKg = parseFloat(vitals.weightKg);
          if (vitals.temperatureC) payload.temperatureC = parseFloat(vitals.temperatureC);
          if (vitals.pulseBpm) payload.pulseBpm = parseInt(vitals.pulseBpm, 10);
          if (vitals.systolicBp) payload.systolicBp = parseInt(vitals.systolicBp, 10);
          if (vitals.diastolicBp) payload.diastolicBp = parseInt(vitals.diastolicBp, 10);
          if (vitals.spo2Percent) payload.spo2Percent = parseFloat(vitals.spo2Percent);
          if (vitals.respiratoryRate) payload.respiratoryRate = parseInt(vitals.respiratoryRate, 10);
          await createPatientVitals(payload as any);
        } catch {
          // vitals failure shouldn't block patient creation
        }
      }
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      closeSheet();
      if (saved?.portalLogin) {
        toast.success(
          `Patient created with portal login — Username: ${saved.portalLogin.username}, Password: ${saved.portalLogin.password}`,
        );
      } else {
        toast.success("Patient created successfully");
      }
    },
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

  const vitalsMutation = useMutation({
    mutationFn: async () => {
      if (!vitalsPatient) return;
      const payload: Record<string, unknown> = { patientId: vitalsPatient.id };
      const f = vitalsForm;
      if (f.heightCm) payload.heightCm = parseFloat(f.heightCm);
      if (f.weightCm) payload.weightKg = parseFloat(f.weightCm);
      if (f.temperatureC) payload.temperatureC = parseFloat(f.temperatureC);
      if (f.pulseBpm) payload.pulseBpm = parseInt(f.pulseBpm, 10);
      if (f.systolicBp) payload.systolicBp = parseInt(f.systolicBp, 10);
      if (f.diastolicBp) payload.diastolicBp = parseInt(f.diastolicBp, 10);
      if (f.spo2Percent) payload.spo2Percent = parseFloat(f.spo2Percent);
      if (f.respiratoryRate) payload.respiratoryRate = parseInt(f.respiratoryRate, 10);
      if (f.medicalStatus) payload.medicalStatus = f.medicalStatus;
      return createPatientVitals(payload as any);
    },
    onSuccess: () => {
      toast.success("Patient vitals recorded");
      setVitalsSheetOpen(false);
      setVitalsPatient(null);
      setVitalsForm({ heightCm: "", weightCm: "", temperatureC: "", pulseBpm: "", systolicBp: "", diastolicBp: "", spo2Percent: "", respiratoryRate: "", medicalStatus: "" });
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  function openAdd() {
    setEditingId(null);
    setPendingFiles([]);
    setForm({ firstName: "", middleName: "", lastName: "", contactNo: "", altContactNo: "", email: "", dateOfBirth: "", gender: "", bloodGroup: "", address: "", emergencyContact: "", allergies: [] });
    setVitals({ heightCm: "", weightKg: "", temperatureC: "", pulseBpm: "", systolicBp: "", diastolicBp: "", spo2Percent: "", respiratoryRate: "" });
    setSheetOpen(true);
  }

  async function openEdit(id: string) {
    setEditingId(id);
    setPendingFiles([]);
    const patient = await queryClient.fetchQuery({ queryKey: ["patient", id], queryFn: () => fetchPatient(id) });
    setForm({
      firstName: patient.firstName, middleName: patient.middleName ?? "", lastName: patient.lastName, contactNo: patient.contactNo, altContactNo: patient.altContactNo ?? "",
      email: patient.email ?? "", dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split("T")[0] ?? "" : "",
      gender: patient.gender ?? "", bloodGroup: patient.bloodGroup ?? "", address: patient.address ?? "", emergencyContact: patient.emergencyContact ?? "",
      allergies: patient.allergies ?? [],
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
    if (!form.firstName.trim() || !form.lastName.trim() || !form.contactNo.trim()) return;
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form, {
        onSuccess: async (patient: Patient) => {
          await uploadPendingDocs(patient.id);
          queryClient.invalidateQueries({ queryKey: ["patients"] });
          closeSheet();
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
      accessorKey: "patientCode",
      header: "Patient",
      cell: ({ row }) => {
        const patient = row.original;
        const fullName = `${patient.firstName} ${patient.middleName ? patient.middleName + ' ' : ''}${patient.lastName}`;
        return (
          <div className="flex items-center gap-3">
            <PatientAvatar photoUrl={photoMap.get(patient.id)} name={fullName} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate font-medium">{fullName}</p>
            
              </div>
              <p className="text-xs text-muted-foreground">{patient.patientCode}</p>
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
            <p>{patient.contactNo}</p>
            {patient.altContactNo && <p>{patient.altContactNo}</p>}
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
      header: () => <div className="text-center">Action</div>,
      cell: ({ row }) => {
        const patient = row.original;
        return (
          <TooltipProvider>
          <div className="flex justify-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => openDocs(patient)}>
                  <FileText className="size-4" />
                  Doc.
                </Button>
              </TooltipTrigger>
              <TooltipContent>Documents</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => { setVitalsPatient(patient); setVitalsSheetOpen(true); }}>
                  <HeartPulse className="size-3.5 text-rose-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Patient Vitals</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 text-primary" onClick={() => navigate({ to: "/appointments/new", search: { patientId: patient.id } })}>
                  <CalendarPlus className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Book Appointment</TooltipContent>
            </Tooltip>
            {canUpdate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(patient.id)}>
                    <Pencil className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit Patient</TooltipContent>
              </Tooltip>
            )}
            {canDelete && (deleteConfirm === patient.id ? (
              <div className="flex items-center gap-1">
                <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => deleteMutation.mutate(patient.id)}>Deactivate</Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => setDeleteConfirm(null)}><X className="size-3.5" /></Button>
                  </TooltipTrigger>
                  <TooltipContent>Cancel</TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(patient.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Deactivate Patient</TooltipContent>
              </Tooltip>
            ))}
          </div>
          </TooltipProvider>
        );
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [deleteConfirm, canUpdate, canDelete]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
          <p className="mt-1 text-sm text-muted-foreground">Register, search, and manage patient records</p>
        </div>
        <Sheet open={sheetOpen && (canCreate || !!editingId)} onOpenChange={setSheetOpen}>
          {canCreate && (
            <SheetTrigger asChild>
              <Button onClick={openAdd}><Plus className="mr-2 size-4" />Add Patient</Button>
            </SheetTrigger>
          )}
          <SheetContent side="right" className="w-[90vw] max-w-[1200px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingId ? "Edit Patient" : "Add Patient"}</SheetTitle>
              <SheetDescription>{editingId ? "Update patient details, photo, and documents." : "Register a new patient. Add photo and documents below (optional)."}</SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-4 px-4 pb-4">
              <FieldGroup>
                {/* ── Photo & Names in same row ── */}
                <div className="flex gap-4 items-start border-t pt-3 mt-2">
                  {/* Profile Photo */}
                  <div className="shrink-0">
                    {editingId ? (
                      <DocumentManager documentableType="Patient" documentableId={editingId} documentType="PROFILE_PHOTO" label="Profile Photo" />
                    ) : (
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => photoInputRef.current?.click()}
                          className="flex size-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted/50 transition-colors hover:border-primary/50 hover:bg-muted shrink-0">
                          {photoPending[0]?.preview ? (
                            <img src={photoPending[0].preview} alt="Photo" className="size-full object-cover" />
                          ) : (
                            <Camera className="size-6 text-muted-foreground/50" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">Profile Photo</p>
                          <p className="text-xs text-muted-foreground">{photoPending[0] ? photoPending[0].file.name : "Click to select a photo"}</p>
                        </div>
                        <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handlePhotoSelect} />
                      </div>
                    )}
                  </div>
                  {/* Name fields */}
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <Field><FieldLabel htmlFor="p-firstName">First Name *</FieldLabel><Input id="p-firstName" placeholder="John" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></Field>
                    <Field><FieldLabel htmlFor="p-middleName">Middle Name</FieldLabel><Input id="p-middleName" placeholder="M" value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} /></Field>
                    <Field><FieldLabel htmlFor="p-lastName">Last Name *</FieldLabel><Input id="p-lastName" placeholder="Doe" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></Field>
                  </div>
                </div>
                {/* ── Documents ── */}
                {editingId ? (
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium mb-2">Documents & Images <span className="text-xs font-normal text-muted-foreground">(Optional)</span></p>
                    <DocumentUploaderInline patientId={editingId} />
                  </div>
                ) : (
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
                            <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0" title="Remove file" onClick={() => removePending(realIdx)}>
                              <X className="size-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-3">
                  <Field><FieldLabel htmlFor="p-contactNo">Contact No *</FieldLabel><Input id="p-contactNo" placeholder="+1 555-000-0000" value={form.contactNo} onChange={(e) => setForm({ ...form, contactNo: e.target.value })} /></Field>
                  <Field><FieldLabel htmlFor="p-altContactNo">Alt Contact No</FieldLabel><Input id="p-altContactNo" placeholder="+1 555-000-0001" value={form.altContactNo} onChange={(e) => setForm({ ...form, altContactNo: e.target.value })} /></Field>
                  <Field><FieldLabel htmlFor="p-email">Email</FieldLabel><Input id="p-email" type="email" placeholder="john@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                  <Field><FieldLabel htmlFor="p-emergency">Emergency Contact</FieldLabel><Input id="p-emergency" placeholder="+1 555-000-0001" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} /></Field>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <Field><FieldLabel htmlFor="p-dob">Date of Birth</FieldLabel><Input id="p-dob" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></Field>
                  <Field><FieldLabel htmlFor="p-gender">Gender</FieldLabel>
                    <select id="p-gender" className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                      <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                    </select>
                  </Field>
                  <Field><FieldLabel htmlFor="p-blood">Blood Group</FieldLabel>
                    <select id="p-blood" className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                      <option value="">Select</option>
                      {bloodGroups.map((bg) => (<option key={bg.id} value={bg.name}>{bg.name}</option>))}
                    </select>
                  </Field>
                  <Field><FieldLabel htmlFor="p-allergies">Allergies</FieldLabel><AllergySelect value={form.allergies ?? []} onChange={(allergies) => setForm({ ...form, allergies })} /></Field>
                </div>
                {editingId ? (
                  <div className="border-t pt-3 mt-2">
                    <AddressManager addressableType="Patient" addressableId={editingId} />
                  </div>
                ) : (
                  <div className="border-t pt-3 mt-2">
                    <p className="text-xs text-muted-foreground">Save the patient first to add addresses.</p>
                  </div>
                )}
                {/* ── Patient Vitals (create only — immutable once created) ── */}
                {!editingId && (
                <div className="border-t pt-3 mt-2">
                  <p className="text-base font-semibold mb-3">Patient Vitals <span className="text-xs font-normal text-muted-foreground">(optional)</span></p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field><FieldLabel htmlFor="v-height">Height (cm) <span className="text-[10px] font-normal text-muted-foreground">(1 ft = 30.48 cm)</span></FieldLabel><Input id="v-height" type="number" step="0.1" placeholder="170" value={vitals.heightCm} onChange={(e) => setVitals({ ...vitals, heightCm: e.target.value })} /></Field>
                    <Field><FieldLabel htmlFor="v-weight">Weight (kg)</FieldLabel><Input id="v-weight" type="number" step="0.1" placeholder="65" value={vitals.weightKg} onChange={(e) => setVitals({ ...vitals, weightKg: e.target.value })} /></Field>
                    <Field><FieldLabel htmlFor="v-temp">Temperature (°F)</FieldLabel><Input id="v-temp" type="number" step="0.1" placeholder="98.6" value={vitals.temperatureC} onChange={(e) => setVitals({ ...vitals, temperatureC: e.target.value })} /></Field>
                    <Field><FieldLabel htmlFor="v-pulse">Pulse (bpm)</FieldLabel><Input id="v-pulse" type="number" placeholder="72" value={vitals.pulseBpm} onChange={(e) => setVitals({ ...vitals, pulseBpm: e.target.value })} /></Field><Field><FieldLabel htmlFor="v-systolic">Systolic BP <span className="text-[10px] font-normal text-muted-foreground">(heart contracts)</span></FieldLabel><Input id="v-systolic" type="number" placeholder="120" value={vitals.systolicBp} onChange={(e) => setVitals({ ...vitals, systolicBp: e.target.value })} /></Field><Field><FieldLabel htmlFor="v-diastolic">Diastolic BP <span className="text-[10px] font-normal text-muted-foreground">(heart relaxes)</span></FieldLabel><Input id="v-diastolic" type="number" placeholder="80" value={vitals.diastolicBp} onChange={(e) => setVitals({ ...vitals, diastolicBp: e.target.value })} /></Field>
                    <Field><FieldLabel htmlFor="v-spo2">SpO₂ (%)</FieldLabel><Input id="v-spo2" type="number" step="0.1" placeholder="98" value={vitals.spo2Percent} onChange={(e) => setVitals({ ...vitals, spo2Percent: e.target.value })} /></Field>
                    <Field><FieldLabel htmlFor="v-rr">Respiratory Rate</FieldLabel><Input id="v-rr" type="number" placeholder="16" value={vitals.respiratoryRate} onChange={(e) => setVitals({ ...vitals, respiratoryRate: e.target.value })} /></Field>
                  </div>
                </div>
                )}

              </FieldGroup>
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={closeSheet}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.firstName.trim() || !form.lastName.trim() || !form.contactNo.trim() || createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Save Changes" : "Register Patient"}
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
                {canCreate && <Button size="sm" onClick={openAdd}><Plus className="mr-1.5 size-3.5" />Add Patient</Button>}
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* ── Documents Sheet (opened from table actions) ── */}
      <Sheet open={docSheetOpen} onOpenChange={setDocSheetOpen}>
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Documents — {docSheetPatient ? getPatientName(docSheetPatient) : ""}</SheetTitle>
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

      {/* ── Patient Vitals Sheet ── */}
      <Sheet open={vitalsSheetOpen} onOpenChange={(open) => { if (!open) { setVitalsSheetOpen(false); setVitalsPatient(null); } }}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Record Patient Vitals</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-4">
            <p className="text-sm text-muted-foreground">Patient: <span className="font-medium text-foreground">{vitalsPatient ? getPatientName(vitalsPatient) : ""}</span></p>
            <div className="grid grid-cols-2 gap-3">
              <Field><FieldLabel>Height (cm)</FieldLabel><Input type="number" min={0} value={vitalsForm.heightCm} onChange={(e) => setVitalsForm((p) => ({ ...p, heightCm: e.target.value }))} /></Field>
              <Field><FieldLabel>Weight (kg)</FieldLabel><Input type="number" min={0} value={vitalsForm.weightCm} onChange={(e) => setVitalsForm((p) => ({ ...p, weightCm: e.target.value }))} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field><FieldLabel>Temperature (°F)</FieldLabel><Input type="number" min={0} value={vitalsForm.temperatureC} onChange={(e) => setVitalsForm((p) => ({ ...p, temperatureC: e.target.value }))} /></Field>
              <Field><FieldLabel>Pulse (bpm)</FieldLabel><Input type="number" min={0} value={vitalsForm.pulseBpm} onChange={(e) => setVitalsForm((p) => ({ ...p, pulseBpm: e.target.value }))} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field><FieldLabel>Systolic BP</FieldLabel><Input type="number" min={0} value={vitalsForm.systolicBp} onChange={(e) => setVitalsForm((p) => ({ ...p, systolicBp: e.target.value }))} /></Field>
              <Field><FieldLabel>Diastolic BP</FieldLabel><Input type="number" min={0} value={vitalsForm.diastolicBp} onChange={(e) => setVitalsForm((p) => ({ ...p, diastolicBp: e.target.value }))} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field><FieldLabel>SpO₂ (%)</FieldLabel><Input type="number" min={0} max={100} value={vitalsForm.spo2Percent} onChange={(e) => setVitalsForm((p) => ({ ...p, spo2Percent: e.target.value }))} /></Field>
              <Field><FieldLabel>Resp Rate (/min)</FieldLabel><Input type="number" min={0} value={vitalsForm.respiratoryRate} onChange={(e) => setVitalsForm((p) => ({ ...p, respiratoryRate: e.target.value }))} /></Field>
            </div>
            <Field><FieldLabel>Medical Status</FieldLabel>
              <select className="flex h-9 w-full rounded-none border border-input bg-background px-3 text-sm" value={vitalsForm.medicalStatus} onChange={(e) => setVitalsForm((p) => ({ ...p, medicalStatus: e.target.value }))}>
                <option value="">Select status</option>
                <option value="BEFORE_FASTING">Before Fasting</option>
                <option value="AFTER_MEALS">After Meals</option>
                <option value="AT_REST">At Rest</option>
                <option value="DURING_EXERCISE">During Exercise</option>
              </select>
            </Field>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => { setVitalsSheetOpen(false); setVitalsPatient(null); }}>Cancel</Button>
            <Button onClick={() => vitalsMutation.mutate()} disabled={vitalsMutation.isPending}>
              {vitalsMutation.isPending ? "Saving..." : "Record Vitals"}
            </Button>
          </SheetFooter>
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
  const permissions = useAppSelector((state) => state.auth.user?.permissions);
  const canCreate = hasPermission(permissions, "create", "documents");
  const canDelete = hasPermission(permissions, "delete", "documents");

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
            <img src={`/api/documents/by-name/${doc.fileName}/image`} alt="" className="size-10 shrink-0 rounded object-cover" />
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded bg-muted">
              <FileText className="size-5 text-muted-foreground" />
            </span>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{doc.originalName}</p>
            <p className="text-[10px] text-muted-foreground">{doc.caption || doc.documentType} · {(doc.fileSize / 1024).toFixed(0)} KB</p>
          </div>
          {canDelete && (
            <Button variant="ghost" size="icon" className="size-7 shrink-0 text-destructive" title="Delete document" onClick={() => deleteMutation.mutate(doc.id)}>
              <X className="size-3.5" />
            </Button>
          )}
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
          <Button variant="ghost" size="icon" className="size-7 shrink-0" title="Remove file" onClick={() => removePending(idx)}>
            <X className="size-3.5" />
          </Button>
        </div>
      ))}

      {canCreate && (
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
      )}
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
