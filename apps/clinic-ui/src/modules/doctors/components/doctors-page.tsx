import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { CalendarClock, MapPin, Pencil, Plus, Search, Stethoscope, X, Award, BadgeCheck, DollarSign, ShieldCheck, GraduationCap, User, Repeat, UserX, RotateCcw, FileUp, FileText, Camera } from "lucide-react";
import { AddressManager } from "@/modules/addresses/components/address-manager";
import { DocumentManager } from "@/modules/documents/components/document-manager";
import { DocumentGallery } from "@/modules/documents/components/document-viewer";
import { fetchDoctors, fetchDoctor, createDoctorWithUser, updateDoctor, deleteDoctor, restoreDoctor, fetchDoctorUser, updateDoctorWithUser, fetchDocumentsByEntity, uploadDocument, deleteDocument, type Doctor, type CreateDoctorInput, type CreateDoctorWithUserInput } from "@/lib/api";
import { fetchDoctorSchedules, createEmployeeSchedule, updateEmployeeSchedule, deleteEmployeeSchedule } from "../data/api";
import { fetchShifts, type Shift } from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/data-table/data-table";
import { DAYS, SCHEDULE_TEMPLATES, type DayForm, type ScheduleTemplate } from "../data/interface";

function emptyScheduleForm(): DayForm[] {
  return DAYS.map((day) => ({ enabled: day.value < 5, startTime: "09:00", endTime: "17:00" }));
}

export function DoctorsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showDropped, setShowDropped] = useState(false);

  const [form, setForm] = useState<CreateDoctorInput & Partial<CreateDoctorWithUserInput>>({
    specialization: "",
    medicalRegistrationNo: "",
    consultationFee: 0,
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["doctors", search, showDropped, pagination.pageIndex, pagination.pageSize],
    queryFn: () => fetchDoctors({
      search: search || undefined,
      isActive: showDropped ? 'false' : 'true',
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
    }),
    placeholderData: (previous) => previous,
  });

  const doctors = response?.data ?? [];
  const pageCount = response?.meta?.totalPages ?? 0;

  const createMutation = useMutation({
    mutationFn: createDoctorWithUser,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["doctors"] }); closeSheet(); toast.success("Doctor created successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDoctorInput> | Partial<CreateDoctorWithUserInput> }) => updateDoctorWithUser(id, data as Partial<CreateDoctorWithUserInput>),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["doctors"] }); closeSheet(); toast.success("Doctor updated successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteDoctor,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["doctors"] }); setDeleteConfirm(null); toast.success("Doctor dropped — can be restored anytime"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });
  const restoreMutation = useMutation({
    mutationFn: restoreDoctor,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["doctors"] }); setDeleteConfirm(null); toast.success("Doctor restored successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  const [scheduleDoctorId, setScheduleDoctorId] = useState<string | null>(null);
  const [scheduleDoctorSpecialization, setScheduleDoctorSpecialization] = useState<string | null>(null);
  const [addressDoctorId, setAddressDoctorId] = useState<string | null>(null);
  const [docSheetOpen, setDocSheetOpen] = useState(false);
  const [docSheetDoctor, setDocSheetDoctor] = useState<Doctor | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [scheduleForm, setScheduleForm] = useState<DayForm[]>(emptyScheduleForm());

  const scheduleQuery = useQuery({
    queryKey: ["employee-schedules", "Doctor", scheduleDoctorId],
    queryFn: () => fetchDoctorSchedules(scheduleDoctorId!),
    enabled: !!scheduleDoctorId,
  });

  const shiftsQuery = useQuery({
    queryKey: ["shifts", "all"],
    queryFn: () => fetchShifts({ limit: 50 }),
    enabled: !!scheduleDoctorId,
  });

  const shifts = useMemo(() => shiftsQuery.data?.data ?? [], [shiftsQuery.data]);

  useEffect(() => {
    if (!scheduleDoctorId) return;
    const next = emptyScheduleForm();
    for (const s of scheduleQuery.data ?? []) {
      next[s.dayOfWeek] = { enabled: true, id: s.id, startTime: s.startTime, endTime: s.endTime, shiftId: s.shiftId ?? undefined };
    }
    setScheduleForm(next);
  }, [scheduleDoctorId, scheduleQuery.data]);

  const saveScheduleMutation = useMutation({
    mutationFn: async () => {
      const currentDoctorId = scheduleDoctorId;
      if (!currentDoctorId) return;

      // Run operations SEQUENTIALLY (not in parallel) to avoid race conditions
      // with the overlap validation on the backend.
      const existingSchedules = scheduleQuery.data ?? [];

      for (const [dayOfWeek, day] of scheduleForm.entries()) {
        const base = {
          employeeSchedulableType: 'Doctor' as const,
          employeeSchedulableId: currentDoctorId,
          dayOfWeek,
          startTime: day.startTime,
          endTime: day.endTime,
          shiftId: day.shiftId || undefined,
        };

        try {
          if (day.enabled && day.id) {
            await updateEmployeeSchedule(day.id!, base);
          } else if (day.enabled && !day.id) {
            await createEmployeeSchedule(base);
          } else if (!day.enabled && day.id) {
            await deleteEmployeeSchedule(day.id!);
          }
        } catch (err: unknown) {
          // If CREATE failed with 400 (overlap), fall back to UPDATE
          const apiErr = err as { status?: number };
          if (day.enabled && !day.id && apiErr.status === 400) {
            const existing = existingSchedules.find((s) => s.dayOfWeek === dayOfWeek);
            if (existing) {
              await updateEmployeeSchedule(existing.id!, base);
            } else {
              throw err;
            }
          } else {
            throw err;
          }
        }
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["employee-schedules", "Doctor", scheduleDoctorId] }); setScheduleDoctorId(null); toast.success("Schedule saved successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  function updateDay(dayOfWeek: number, patch: Partial<DayForm>) {
    setScheduleForm((prev) => prev.map((day, i) => (i === dayOfWeek ? { ...day, ...patch } : day)));
  }

  /** Apply a shift's times to all enabled days */
  function applyShiftToAll(shift: Shift) {
    setScheduleForm((prev) =>
      prev.map((day) =>
        day.enabled
          ? { ...day, startTime: shift.startTime, endTime: shift.endTime, shiftId: shift.id }
          : day,
      ),
    );
  }

  /** Apply a weekly schedule template to the entire form — preserves existing schedule IDs */
  function applyTemplate(template: ScheduleTemplate) {
    setScheduleForm((prev) => {
      const next = [...prev];
      for (const td of template.days) {
        next[td.dayOfWeek] = { ...next[td.dayOfWeek], enabled: true, startTime: td.startTime, endTime: td.endTime };
      }
      return next;
    });
  }

  /** Templates that match the current doctor's specialization, if any */
  const suggestedTemplates = useMemo(() => {
    if (!scheduleDoctorSpecialization) return [];
    return SCHEDULE_TEMPLATES.filter(
      (t) => t.specialization?.toLowerCase() === scheduleDoctorSpecialization.toLowerCase(),
    );
  }, [scheduleDoctorSpecialization]);

  function openAdd() {
    setEditingId(null);
    setPendingFiles([]);
    setForm({
      specialization: "",
      medicalRegistrationNo: "",
      consultationFee: 0,
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      password: "",
      mobileNumber: "",
      addressType: "CLINIC",
      addressLine1: "",
      city: "",
      state: "",
      country: "India",
      postalCode: "",
    });
    setSheetOpen(true);
  }

  async function openEdit(id: string) {
    setEditingId(id);
    setPendingFiles([]);
    const doctor = await queryClient.fetchQuery({ queryKey: ["doctor", id], queryFn: () => fetchDoctor(id) });
    // Fetch linked user for pre-filling user account fields
    let userData: Record<string, string | undefined> = {};
    try {
      const user = await fetchDoctorUser(id);
      userData = {
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName ?? undefined,
        email: user.email,
        username: user.username,
        mobileNumber: user.mobileNumber ?? undefined,
      };
    } catch {
      // No linked user found — leave user fields empty
    }
    setForm({
      // User account fields
      ...userData,
      // Doctor professional fields
      specialization: doctor.specialization ?? "",
      medicalRegistrationNo: doctor.medicalRegistrationNo,
      consultationFee: doctor.consultationFee,
      qualification: doctor.qualification ?? undefined,
      medicalCouncil: doctor.medicalCouncil ?? undefined,
      registrationYear: doctor.registrationYear ?? undefined,
      yearsOfExperience: doctor.yearsOfExperience ?? undefined,
      consultationMode: doctor.consultationMode,
      verificationStatus: doctor.verificationStatus,
      // Address fields start empty (managed via AddressManager sheet)
      addressType: "CLINIC",
      addressLine1: "",
      city: "",
      state: "",
      country: "India",
      postalCode: "",
    });
    setSheetOpen(true);
  }

  function closeSheet() { setSheetOpen(false); setEditingId(null); setPendingFiles([]); }

  function openDocs(doctor: Doctor) { setDocSheetDoctor(doctor); setDocSheetOpen(true); }

  const uploadPendingDocs = async (doctorId: string) => {
    for (const pf of pendingFiles) {
      try {
        await uploadDocument(pf.file, pf.documentType, "Doctor", doctorId, { caption: pf.label || undefined, isPrimary: pf.documentType === "PROFILE_PHOTO" });
      } catch { /* toast per file */ }
    }
    if (pendingFiles.length > 0) {
      queryClient.invalidateQueries({ queryKey: ["documents", "Doctor", doctorId] });
    }
  };

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10 MB"); return; }
    setPendingFiles((prev) => [...prev, { file, label: "Profile Photo", documentType: "PROFILE_PHOTO", preview: URL.createObjectURL(file) }]);
    e.target.value = "";
  }

  function handleDocSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is over 10 MB, skipped`); continue; }
      setPendingFiles((prev) => [...prev, { file, label: "", documentType: file.type.startsWith("image/") ? "OTHER" : "CERTIFICATE" }]);
    }
    e.target.value = "";
  }

  function removePending(index: number) {
    setPendingFiles((prev) => { const r = prev[index]; if (r?.preview) URL.revokeObjectURL(r.preview); return prev.filter((_, i) => i !== index); });
  }

  function updatePendingLabel(index: number, label: string) {
    setPendingFiles((prev) => prev.map((f, i) => i === index ? { ...f, label } : f));
  }

  function handleSave() {
    if (!form.medicalRegistrationNo.trim()) return;
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form as Partial<CreateDoctorWithUserInput> });
    } else {
      createMutation.mutate(form as CreateDoctorWithUserInput, {
        onSuccess: async (result: any) => {
          const doctorId = result?.doctor?.id || result?.id;
          if (doctorId) await uploadPendingDocs(doctorId);
        },
      });
    }
  }

  const columns = useMemo<ColumnDef<Doctor>[]>(() => [
    {
      accessorKey: "id",
      header: "Doctor",
      cell: ({ row }) => {
        const doctor = row.original;
        return (
          <div className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Stethoscope className="size-3.5 text-primary" />
            </span>
            <div>
              <p className="truncate font-medium">{doctor.name || `Doctor (${doctor.id.slice(0, 8)})`}</p>
              <p className="text-xs text-muted-foreground">{doctor.specialization ?? 'General'}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "specialization",
      header: "Specialization",
      cell: ({ row }) => {
        const specialization = row.original.specialization;
        if (!specialization) return <span className="text-muted-foreground">—</span>;
        return (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Award className="size-3" />{specialization}
          </span>
        );
      },
    },
    {
      accessorKey: "medicalRegistrationNo",
      header: "Reg. No.",
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <BadgeCheck className="size-3" />{row.original.medicalRegistrationNo}
        </span>
      ),
    },
    {
      accessorKey: "consultationFee",
      header: "Fee",
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <DollarSign className="size-3" />₹{row.original.consultationFee}
        </span>
      ),
    },
    {
      accessorKey: "verificationStatus",
      header: "Status",
      cell: ({ row }) => {
        const doctor = row.original;
        if (!doctor.isActive) return <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed"><UserX className="mr-1 size-2.5" />Dropped</Badge>;
        const status = doctor.verificationStatus;
        if (status === 'VERIFIED') return <Badge variant="default" className="bg-green-600/10 text-green-600 text-[10px]"><BadgeCheck className="mr-1 size-2.5" />Verified</Badge>;
        if (status === 'REJECTED') return <Badge variant="destructive" className="text-[10px]">Rejected</Badge>;
        if (status === 'SUSPENDED') return <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-600">Suspended</Badge>;
        return <Badge variant="secondary" className="text-[10px]">Pending</Badge>;
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const doctor = row.original;
        return (
          <div className="flex justify-end gap-1">
            {doctor.isActive ? (
              <>
                <Button variant="ghost" size="icon" className="size-8" title="Documents" onClick={() => openDocs(doctor)}>
                  <FileText className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="size-8" title="Weekly schedule" onClick={() => { setScheduleDoctorId(doctor.id); setScheduleDoctorSpecialization(doctor.specialization ?? null); }}>
                  <CalendarClock className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="size-8" title="Addresses" onClick={() => setAddressDoctorId(doctor.id)}>
                  <MapPin className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(doctor.id)}>
                  <Pencil className="size-3.5" />
                </Button>
                {deleteConfirm === doctor.id ? (
                  <div className="flex items-center gap-1">
                    <Button variant="secondary" size="sm" className="h-8 text-xs" onClick={() => deleteMutation.mutate(doctor.id)}>Drop</Button>
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => setDeleteConfirm(null)}><X className="size-3.5" /></Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-amber-600" title="Drop doctor" onClick={() => setDeleteConfirm(doctor.id)}>
                    <UserX className="size-3.5" />
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="ghost" size="icon" className="size-8" title="Restore" onClick={() => restoreMutation.mutate(doctor.id)}>
                  <RotateCcw className="size-3.5" />
                </Button>
                <span className="text-[10px] text-muted-foreground italic">Dropped</span>
              </>
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
          <h1 className="text-2xl font-semibold tracking-tight">Doctors</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage doctor professional profiles, credentials, and verification</p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild><Button onClick={openAdd}><Plus className="mr-2 size-4" />Add Doctor</Button></SheetTrigger>
          <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingId ? "Edit Doctor" : "Add Doctor"}</SheetTitle>
              <SheetDescription>
                {editingId
                  ? "Update doctor professional details."
                  : "Create a new doctor with user account and optional address in one step."}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-5 px-4 pb-4 pt-5">
              <FieldGroup>
                {/* ─── User Account Section ─── */}
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="size-4" />
                  <span>User Account</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="du-first">First Name {editingId ? '' : '* '}</FieldLabel>
                    <Input id="du-first" placeholder="John" value={form.firstName ?? ""} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="du-last">Last Name {editingId ? '' : '* '}</FieldLabel>
                    <Input id="du-last" placeholder="Doe" value={form.lastName ?? ""} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="du-email">Email {editingId ? '' : '* '}</FieldLabel>
                  <Input id="du-email" type="email" placeholder="doctor@clinic.com" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="du-username">Username {editingId ? '' : '* '}</FieldLabel>
                    <Input id="du-username" placeholder="drjohndoe" value={form.username ?? ""} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="du-password">{editingId ? 'New Password (leave blank to keep)' : 'Password *'}</FieldLabel>
                    <Input id="du-password" type="password" placeholder={editingId ? "Unchanged" : "Min 8 chars"} value={form.password ?? ""} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="du-mobile">Mobile Number</FieldLabel>
                  <Input id="du-mobile" placeholder="+919810000001" value={form.mobileNumber ?? ""} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} />
                </Field>
                <Separator className="my-2" />

                {/* ─── Doctor Professional Section ─── */}
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Stethoscope className="size-4" />
                  <span>Doctor Professional</span>
                </div>
                <Field>
                  <FieldLabel htmlFor="d-reg">Medical Registration No. *</FieldLabel>
                  <Input id="d-reg" placeholder="MCI-10001" value={form.medicalRegistrationNo} onChange={(e) => setForm({ ...form, medicalRegistrationNo: e.target.value })} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="d-specialization">Specialization</FieldLabel>
                    <Input id="d-specialization" placeholder="Cardiology" value={form.specialization ?? ""} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="d-qualification">Qualification</FieldLabel>
                    <Input id="d-qualification" placeholder="MBBS, MD" value={form.qualification ?? ""} onChange={(e) => setForm({ ...form, qualification: e.target.value })} />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="d-council">Medical Council</FieldLabel>
                  <Input id="d-council" placeholder="Medical Council of India" value={form.medicalCouncil ?? ""} onChange={(e) => setForm({ ...form, medicalCouncil: e.target.value })} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="d-reg-year">Reg. Year</FieldLabel>
                    <Input id="d-reg-year" type="number" placeholder="2015" value={form.registrationYear ?? ""} onChange={(e) => setForm({ ...form, registrationYear: e.target.value ? Number(e.target.value) : undefined })} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="d-exp">Experience (yrs)</FieldLabel>
                    <Input id="d-exp" type="number" placeholder="10" value={form.yearsOfExperience ?? ""} onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value ? Number(e.target.value) : undefined })} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="d-fee">Consultation Fee (₹)</FieldLabel>
                    <Input id="d-fee" type="number" placeholder="500" value={form.consultationFee ?? ""} onChange={(e) => setForm({ ...form, consultationFee: e.target.value ? Number(e.target.value) : 0 })} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="d-mode">Mode</FieldLabel>
                    <Select value={form.consultationMode ?? "OFFLINE"} onValueChange={(v) => setForm({ ...form, consultationMode: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OFFLINE">Offline</SelectItem>
                        <SelectItem value="ONLINE">Online</SelectItem>
                        <SelectItem value="BOTH">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                {/* Verification status */}
                <Field>
                  <FieldLabel htmlFor="d-verification">Verification Status</FieldLabel>
                  <Select value={form.verificationStatus ?? "PENDING"} onValueChange={(v) => setForm({ ...form, verificationStatus: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="VERIFIED">Verified</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                {/* ─── Address Section (optional) ─── */}
                <Separator className="my-2" />
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MapPin className="size-4" />
                  <span>Address (optional)</span>
                </div>
                <Field>
                  <FieldLabel htmlFor="da-type">Address Type</FieldLabel>
                  <Select value={form.addressType ?? "CLINIC"} onValueChange={(v) => setForm({ ...form, addressType: v })}>
                    <SelectTrigger id="da-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLINIC">Clinic</SelectItem>
                      <SelectItem value="HOME">Home</SelectItem>
                      <SelectItem value="BILLING">Billing</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="da-line1">Address Line 1</FieldLabel>
                  <Input id="da-line1" placeholder="123 Main Street" value={form.addressLine1 ?? ""} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="da-city">City</FieldLabel>
                    <Input id="da-city" placeholder="Mumbai" value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="da-state">State</FieldLabel>
                    <Input id="da-state" placeholder="Maharashtra" value={form.state ?? ""} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="da-pincode">Postal Code</FieldLabel>
                    <Input id="da-pincode" placeholder="400001" value={form.postalCode ?? ""} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="da-country">Country</FieldLabel>
                    <Input id="da-country" placeholder="India" value={form.country ?? "India"} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                  </Field>
                </div>

                {/* ─── Documents Section ─── */}
                <Separator className="my-2" />
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileUp className="size-4" />
                  <span>Photo & Documents <span className="text-xs font-normal">(Optional)</span></span>
                </div>
                {editingId ? (
                  <div className="space-y-4">
                    <DocumentManager documentableType="Doctor" documentableId={editingId} documentType="PROFILE_PHOTO" label="Profile Photo" />
                    <DoctorDocUploader doctorId={editingId} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Photo preview */}
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => photoInputRef.current?.click()}
                        className="flex size-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted/50 transition-colors hover:border-primary/50 hover:bg-muted shrink-0">
                        {pendingFiles.find((f) => f.documentType === "PROFILE_PHOTO")?.preview ? (
                          <img src={pendingFiles.find((f) => f.documentType === "PROFILE_PHOTO")!.preview} alt="Photo" className="size-full object-cover" />
                        ) : (
                          <Camera className="size-6 text-muted-foreground/50" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Profile Photo</p>
                        <p className="text-xs text-muted-foreground">{pendingFiles.find((f) => f.documentType === "PROFILE_PHOTO")?.file.name || "Click to select"}</p>
                      </div>
                      <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handlePhotoSelect} />
                    </div>
                    {/* Other documents */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Certificates, degrees, etc.</p>
                      <Button type="button" variant="outline" size="sm" onClick={() => docInputRef.current?.click()}>
                        <FileUp className="mr-1.5 size-3.5" /> Add File
                      </Button>
                      <input ref={docInputRef} type="file" accept="image/*,application/pdf,.doc,.docx" multiple className="hidden" onChange={handleDocSelect} />
                    </div>
                    {pendingFiles.filter((f) => f.documentType !== "PROFILE_PHOTO").length === 0 && (
                      <p className="text-xs text-muted-foreground">No documents added yet. You can add them now or later.</p>
                    )}
                    <div className="space-y-2">
                      {pendingFiles.filter((f) => f.documentType !== "PROFILE_PHOTO").map((pf) => {
                        const realIdx = pendingFiles.indexOf(pf);
                        return (
                          <div key={realIdx} className="flex items-center gap-2 rounded-none border p-2">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded bg-muted">
                              <FileUp className="size-5 text-muted-foreground" />
                            </span>
                            <div className="flex-1 min-w-0 space-y-1">
                              <p className="text-xs truncate text-muted-foreground">{pf.file.name}</p>
                              <Input placeholder="Label (e.g. Medical Council Certificate)" className="h-7 text-xs" value={pf.label} onChange={(e) => updatePendingLabel(realIdx, e.target.value)} />
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => removePending(realIdx)}>
                              <X className="size-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </FieldGroup>
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={closeSheet}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.medicalRegistrationNo.trim() || createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Save Changes" : "Create Doctor"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader className="pb-3 space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant={!showDropped ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => { setShowDropped(false); setPagination((p) => ({ ...p, pageIndex: 0 })); setDeleteConfirm(null); }}
            >
              Active
            </Button>
            <Button
              variant={showDropped ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => { setShowDropped(true); setPagination((p) => ({ ...p, pageIndex: 0 })); setDeleteConfirm(null); }}
            >
              <UserX className="mr-1 size-3" />
              Dropped
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={showDropped ? "Search dropped doctors..." : "Search by specialization or registration number..."}
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
            data={doctors}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                {showDropped ? <UserX className="size-8 text-muted-foreground/50" /> : <Stethoscope className="size-8 text-muted-foreground/50" />}
                <p className="text-sm text-muted-foreground">{search ? "No doctors found" : showDropped ? "No dropped doctors" : "No doctors registered yet"}</p>
                {showDropped && !search && <p className="text-xs text-muted-foreground">Dropped doctors can be restored anytime from this view.</p>}
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* Addresses sheet */}
      <Sheet open={!!addressDoctorId} onOpenChange={(open) => !open && setAddressDoctorId(null)}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>Doctor Addresses</SheetTitle><SheetDescription>Manage clinic, home, and billing addresses</SheetDescription></SheetHeader>
          <div className="flex-1 px-4 pb-4 pt-4">
            {addressDoctorId && <AddressManager addressableType="Doctor" addressableId={addressDoctorId} />}
          </div>
        </SheetContent>
      </Sheet>

      {/* Documents sheet */}
      <Sheet open={docSheetOpen} onOpenChange={setDocSheetOpen}>
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Documents — Doctor</SheetTitle>
            <SheetDescription>Upload and manage documents for this doctor.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4 space-y-4">
            {docSheetDoctor?.id && (
              <>
                <DocumentManager documentableType="Doctor" documentableId={docSheetDoctor.id} documentType="PROFILE_PHOTO" label="Profile Photo" />
                <div className="border-t pt-3">
                  <p className="text-sm font-medium mb-2">Upload Documents <span className="text-xs font-normal text-muted-foreground">(Optional)</span></p>
                  <DoctorDocUploader doctorId={docSheetDoctor.id} />
                </div>
                <div className="border-t pt-3">
                  <DocumentGallery documentableType="Doctor" documentableId={docSheetDoctor.id} />
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!scheduleDoctorId} onOpenChange={(open) => !open && (setScheduleDoctorId(null), setScheduleDoctorSpecialization(null))}>
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Weekly Schedule</SheetTitle>
            <SheetDescription>Set working hours per day. Appointment slots are generated from these hours.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-3 px-4 pb-4">
            {/* ─── Specialty schedule templates ─── */}
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {suggestedTemplates.length > 0
                  ? `💡 Suggested for ${scheduleDoctorSpecialization}:`
                  : 'Preset schedule templates:'}
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedTemplates.map((t) => (
                  <Button
                    key={t.id}
                    variant="default"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => applyTemplate(t)}
                    title={t.description}
                  >
                    {t.name}
                  </Button>
                ))}
                {SCHEDULE_TEMPLATES.filter(
                  (t) => !suggestedTemplates.some((st) => st.id === t.id),
                ).map((t) => (
                  <Button
                    key={t.id}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => applyTemplate(t)}
                    title={t.description}
                  >
                    {t.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Shift template bar */}
            {shifts.length > 0 && (
              <div className="rounded-lg border border-dashed p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Apply shift to all enabled days:</p>
                <div className="flex flex-wrap gap-2">
                  {shifts.map((shift) => (
                    <Button
                      key={shift.id}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => applyShiftToAll(shift)}
                    >
                      <Repeat className="mr-1 size-3" />
                      {shift.name} ({shift.startTime}–{shift.endTime})
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Day-by-day editor ─── */}
            {scheduleQuery.isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
            ) : (
              DAYS.map(({ value, label }) => {
                const day = scheduleForm[value];
                if (!day) return null;
                return (
                  <div key={value} className="rounded-none border p-3">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input type="checkbox" className="size-4 accent-primary" checked={day.enabled} onChange={(e) => updateDay(value, { enabled: e.target.checked })} />
                      {label}
                    </label>
                    {day.enabled && (
                      <div className="mt-3 space-y-3">
                        {/* Shift picker for this day */}
                        {shifts.length > 0 && (
                          <Field>
                            <FieldLabel>Shift</FieldLabel>
                            <Select
                              value={day.shiftId ?? ""}
                              onValueChange={(shiftId) => {
                                const selected = shifts.find((s) => s.id === shiftId);
                                if (selected) {
                                  updateDay(value, {
                                    shiftId,
                                    startTime: selected.startTime,
                                    endTime: selected.endTime,
                                  });
                                }
                              }}
                            >
                              <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Custom times" />
                              </SelectTrigger>
                              <SelectContent>
                                {shifts.map((s) => (
                                  <SelectItem key={s.id} value={s.id} className="text-xs">
                                    {s.name} ({s.startTime}–{s.endTime})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <Field><FieldLabel htmlFor={`start-${value}`}>Start</FieldLabel><Input id={`start-${value}`} type="time" value={day.startTime} onChange={(e) => updateDay(value, { startTime: e.target.value, shiftId: undefined })} /></Field>
                          <Field><FieldLabel htmlFor={`end-${value}`}>End</FieldLabel><Input id={`end-${value}`} type="time" value={day.endTime} onChange={(e) => updateDay(value, { endTime: e.target.value, shiftId: undefined })} /></Field>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => { setScheduleDoctorId(null); setScheduleDoctorSpecialization(null); }}>Cancel</Button>
            <Button onClick={() => saveScheduleMutation.mutate()} disabled={saveScheduleMutation.isPending}>Save Schedule</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ── Pending files type ──
interface PendingFile {
  file: File;
  label: string;
  documentType: string;
  preview?: string;
}

// ── Inline doc uploader for edit mode ──
function DoctorDocUploader({ doctorId }: { doctorId: string }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingFiles, setPendingFiles] = useState<{ file: File; label: string; preview?: string }[]>([]);

  const { data: docs = [] } = useQuery({
    queryKey: ["documents", "Doctor", doctorId],
    queryFn: () => fetchDocumentsByEntity("Doctor", doctorId),
    enabled: !!doctorId,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, caption }: { file: File; caption?: string }) =>
      uploadDocument(file, file.type.startsWith("image/") ? "OTHER" : "CERTIFICATE", "Doctor", doctorId, { caption }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["documents", "Doctor", doctorId] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["documents", "Doctor", doctorId] }); toast.success("Document removed"); },
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
    // Cleanup previews
    for (const pf of pendingFiles) { if (pf.preview) URL.revokeObjectURL(pf.preview); }
    setPendingFiles([]);
    if (ok > 0) toast.success(`${ok} document${ok === 1 ? "" : "s"} uploaded`);
  }

  const nonPhotoDocs = docs.filter((d) => d.documentType !== "PROFILE_PHOTO" && d.isActive);

  return (
    <div className="space-y-3">
      {/* Existing docs */}
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

      {/* Pending files with labels */}
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
            <Input placeholder="Label (e.g. Medical Council Certificate)" className="h-7 text-xs" value={pf.label} onChange={(e) => updatePendingLabel(idx, e.target.value)} />
          </div>
          <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => removePending(idx)}>
            <X className="size-3.5" />
          </Button>
        </div>
      ))}

      {/* Upload controls */}
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
        <p className="text-xs text-muted-foreground">No documents yet. Click "Add File" to upload certificates, degrees, etc.</p>
      )}
    </div>
  );
}
