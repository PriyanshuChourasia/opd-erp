import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { CalendarClock, CalendarPlus, MapPin, Pencil, Plus, Search, Stethoscope, X, Award, BadgeCheck, DollarSign, ShieldCheck, GraduationCap, User, UserX, UserCheck, Repeat, FileUp, FileText, Camera } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { AddressManager } from "@/modules/addresses/components/address-manager";
import { DocumentManager } from "@/modules/documents/components/document-manager";
import { DocumentGallery } from "@/modules/documents/components/document-viewer";
import { fetchDoctors, fetchDoctor, createDoctorWithUser, updateDoctor, fetchDoctorUser, updateDoctorWithUser, fetchDocumentsByEntity, uploadDocument, deleteDocument, deleteDoctor, restoreDoctor, type Doctor, type CreateDoctorInput, type CreateDoctorWithUserInput, type AddressEntry, INDIAN_STATES } from "@/lib/api";
import { fetchDoctorSchedules, createEmployeeSchedule, updateEmployeeSchedule, deleteEmployeeSchedule, fetchDoctorScheduleExceptions, createDoctorScheduleException, deleteDoctorScheduleException } from "../data/api";
import { fetchShifts, type Shift } from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/data-table/data-table";
import { DAYS, SCHEDULE_TEMPLATES, type DayBlock, type DayForm, type ScheduleTemplate } from "../data/interface";
import { type CreateEmployeeScheduleExceptionInput, type EmployeeScheduleExceptionType } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";
import { hasPermission } from "@/lib/roles";

function emptyScheduleForm(): DayForm[] {
  return DAYS.map((day) => ({
    enabled: day.value < 5,
    // Deliberately empty — the load effect below pushes the doctor's real
    // saved blocks onto this array. A pre-filled default here would sit
    // alongside the real block after loading (same day, same time range),
    // and the client-side overlap check would then reject it as a fake
    // self-overlap the instant the user tries to add a genuine second shift.
    blocks: [],
  }));
}

/** Today / offset date as a local YYYY-MM-DD string. */
function toDateStr(d: Date): string {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

const EXCEPTION_TYPE_LABEL: Record<EmployeeScheduleExceptionType, string> = {
  EXTRA_SHIFT: "Extra shift",
  OVERRIDE: "Override",
  DAY_OFF: "Day off",
};

export function DoctorsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const permissions = useAppSelector((state) => state.auth.user?.permissions);
  const canCreate = hasPermission(permissions, "create", "doctors");
  const canUpdate = hasPermission(permissions, "update", "doctors");
  const canDelete = hasPermission(permissions, "delete", "doctors");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);


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
  const [addresses, setAddresses] = useState<AddressEntry[]>([]);

  const { data: response, isLoading } = useQuery({
    queryKey: ["doctors", search, pagination.pageIndex, pagination.pageSize],
    queryFn: () => fetchDoctors({
      search: search || undefined,
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
    }),
    placeholderData: (previous) => previous,
  });

  const doctors = response?.data ?? [];
  const pageCount = response?.meta?.totalPages ?? 0;

  const createMutation = useMutation({
    mutationFn: createDoctorWithUser,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["doctors"] }); queryClient.invalidateQueries({ queryKey: ["employee-schedules"] }); queryClient.invalidateQueries({ queryKey: ["doctor-slots"] }); closeSheet(); toast.success("Doctor created successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDoctorInput> | Partial<CreateDoctorWithUserInput> }) => updateDoctorWithUser(id, data as Partial<CreateDoctorWithUserInput>),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["doctors"] }); closeSheet(); toast.success("Doctor updated successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? restoreDoctor(id) : deleteDoctor(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["doctors"] }); toast.success("Doctor status updated"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });


  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; doctor: Doctor | null; action: 'deactivate' | 'activate' }>({ open: false, doctor: null, action: 'deactivate' });

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

  // ── One-off schedule exceptions (date-specific changes) ──
  const exceptionsFrom = useMemo(() => toDateStr(new Date()), []);
  const exceptionsTo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return toDateStr(d);
  }, []);
  const scheduleExceptionsQuery = useQuery({
    queryKey: ["employee-schedule-exceptions", scheduleDoctorId, exceptionsFrom, exceptionsTo],
    queryFn: () => fetchDoctorScheduleExceptions(scheduleDoctorId!, exceptionsFrom, exceptionsTo),
    enabled: !!scheduleDoctorId,
  });
  const upcomingExceptions = scheduleExceptionsQuery.data ?? [];

  const [exceptionForm, setExceptionForm] = useState<{
    type: EmployeeScheduleExceptionType;
    date: string;
    shiftId: string;
    startTime: string;
    endTime: string;
  }>({ type: "EXTRA_SHIFT", date: "", shiftId: "", startTime: "", endTime: "" });

  const addExceptionMutation = useMutation({
    mutationFn: (input: CreateEmployeeScheduleExceptionInput) => createDoctorScheduleException(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-schedule-exceptions"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-slots"] });
      setExceptionForm({ type: "EXTRA_SHIFT", date: "", shiftId: "", startTime: "", endTime: "" });
      toast.success("One-time schedule change added");
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  const deleteExceptionMutation = useMutation({
    mutationFn: (id: string) => deleteDoctorScheduleException(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-schedule-exceptions"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-slots"] });
      toast.success("One-time schedule change removed");
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  function handleAddException() {
    if (!scheduleDoctorId) return;
    const { type, date, shiftId, startTime, endTime } = exceptionForm;
    if (!date) { toast.error("Pick a date for the one-time change"); return; }
    // A DAY_OFF covers the whole day — time inputs are hidden and not required.
    const effectiveStart = type === "DAY_OFF" ? "00:00" : startTime;
    const effectiveEnd = type === "DAY_OFF" ? "23:59" : endTime;
    if (!effectiveStart || !effectiveEnd) { toast.error("Enter the start and end time"); return; }
    if (effectiveStart >= effectiveEnd) { toast.error("Start time must be before end time"); return; }
    addExceptionMutation.mutate({
      date,
      type,
      startTime: effectiveStart,
      endTime: effectiveEnd,
      shiftId: shiftId || undefined,
      employeeSchedulableType: "Doctor",
      employeeSchedulableId: scheduleDoctorId,
    });
  }

  useEffect(() => {
    if (!scheduleDoctorId) return;
    const next = emptyScheduleForm();
    for (const s of scheduleQuery.data ?? []) {
      const dayEntry = next[s.dayOfWeek];
      if (!dayEntry) continue;
      dayEntry.blocks.push({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        shiftId: s.shiftId ?? undefined,
      });
      dayEntry.enabled = true;
    }
    setScheduleForm(next);
  }, [scheduleDoctorId, scheduleQuery.data]);

  const saveScheduleMutation = useMutation({
    mutationFn: async () => {
      const currentDoctorId = scheduleDoctorId;
      if (!currentDoctorId) return;

      // Client-side guard mirroring the backend overlap rule: the blocks of an
      // enabled day must not overlap each other.
      for (const day of scheduleForm) {
        if (!day.enabled) continue;
        const blocks = day.blocks.filter((b) => b.startTime && b.endTime);
        for (let i = 0; i < blocks.length; i++) {
          const a = blocks[i];
          if (!a) continue;
          if (a.startTime >= a.endTime) {
            throw new Error("A shift has an invalid time range (start must be before end).");
          }
          for (let j = i + 1; j < blocks.length; j++) {
            const b = blocks[j];
            if (!b) continue;
            if (a.startTime < b.endTime && b.startTime < a.endTime) {
              throw new Error("Two shifts on the same day overlap — adjust the times before saving.");
            }
          }
        }
      }

      // Diff per BLOCK (not per day): a day may hold several shift rows.
      // Run operations SEQUENTIALLY (not in parallel) to avoid race conditions
      // with the overlap validation on the backend.
      const serverRows = scheduleQuery.data ?? [];

      for (const [dayOfWeek, day] of scheduleForm.entries()) {
        const desired = day.enabled ? day.blocks.filter((b) => b.startTime && b.endTime) : [];
        const dayRows = serverRows.filter((s) => s.dayOfWeek === dayOfWeek);

        for (const block of desired) {
          const base = {
            employeeSchedulableType: 'Doctor' as const,
            employeeSchedulableId: currentDoctorId,
            dayOfWeek,
            startTime: block.startTime,
            endTime: block.endTime,
            shiftId: block.shiftId || undefined,
          };
          const matched = block.id
            ? dayRows.find((s) => s.id === block.id)
            : dayRows.find((s) =>
                block.shiftId ? s.shiftId === block.shiftId : s.startTime === block.startTime && s.endTime === block.endTime,
              );
          if (matched && matched.id) {
            await updateEmployeeSchedule(matched.id, base);
          } else {
            // Backend create() auto-upserts when the range overlaps an existing
            // row, so a duplicate resubmit is safe.
            await createEmployeeSchedule(base);
          }
        }

        for (const row of dayRows) {
          const stillWanted = desired.some((b) =>
            b.id === row.id ||
            (b.shiftId ? b.shiftId === row.shiftId : b.startTime === row.startTime && b.endTime === row.endTime),
          );
          if (!stillWanted && row.id) {
            await deleteEmployeeSchedule(row.id);
          }
        }
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["employee-schedules"] }); queryClient.invalidateQueries({ queryKey: ["doctor-slots"] }); queryClient.invalidateQueries({ queryKey: ["employee-schedule-exceptions"] }); setScheduleDoctorId(null); toast.success("Schedule saved successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  function updateDayBlock(dayOfWeek: number, blockIdx: number, patch: Partial<DayBlock>) {
    setScheduleForm((prev) =>
      prev.map((day, i) =>
        i === dayOfWeek
          ? { ...day, blocks: day.blocks.map((b, bi) => (bi === blockIdx ? { ...b, ...patch } : b)) }
          : day,
      ),
    );
  }

  function addDayBlock(dayOfWeek: number) {
    setScheduleForm((prev) =>
      prev.map((day, i) =>
        i === dayOfWeek ? { ...day, enabled: true, blocks: [...day.blocks, { startTime: "", endTime: "" }] } : day,
      ),
    );
  }

  function removeDayBlock(dayOfWeek: number, blockIdx: number) {
    setScheduleForm((prev) =>
      prev.map((day, i) => {
        if (i !== dayOfWeek) return day;
        const blocks = day.blocks.filter((_, bi) => bi !== blockIdx);
        return { enabled: blocks.length > 0, blocks };
      }),
    );
  }

  function setDayEnabled(dayOfWeek: number, enabled: boolean) {
    setScheduleForm((prev) =>
      prev.map((day, i) => {
        if (i !== dayOfWeek) return day;
        if (enabled && day.blocks.length === 0) {
          return { enabled: true, blocks: [{ startTime: "09:00", endTime: "17:00" }] };
        }
        return { ...day, enabled };
      }),
    );
  }

  /** Apply a shift's times to the FIRST block of every enabled day — other blocks are preserved. */
  function applyShiftToAll(shift: Shift) {
    setScheduleForm((prev) =>
      prev.map((day) => {
        if (!day.enabled) return day;
        const blocks = day.blocks.length > 0 ? [...day.blocks] : [{ startTime: "", endTime: "" }];
        blocks[0] = { ...blocks[0], startTime: shift.startTime, endTime: shift.endTime, shiftId: shift.id };
        return { ...day, enabled: true, blocks };
      }),
    );
  }

  /** Apply a weekly schedule template to the entire form — writes into the first block per day, preserving other blocks. */
  function applyTemplate(template: ScheduleTemplate) {
    setScheduleForm((prev) => {
      const next = prev.map((day) => ({ ...day, blocks: [...day.blocks] }));
      for (const td of template.days) {
        const day = next[td.dayOfWeek] ?? { enabled: false, blocks: [] };
        const blocks = day.blocks.length > 0 ? [...day.blocks] : [{ startTime: "", endTime: "" }];
        blocks[0] = { ...blocks[0], startTime: td.startTime, endTime: td.endTime };
        next[td.dayOfWeek] = { enabled: true, blocks };
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
    });
    setAddresses([]);
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
    });
    // Addresses are managed via AddressManager sheet for editing
    setAddresses([]);
    setSheetOpen(true);
  }

  function closeSheet() { setSheetOpen(false); setEditingId(null); setPendingFiles([]); setAddresses([]); }

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
      // Strip medicalRegistrationNo (immutable after creation) and address fields
      // (addresses are managed via AddressManager for editing)
      const { medicalRegistrationNo: _reg, password, addressType, addressLine1, addressLine2, landmark, city, district, state, country, postalCode, ...rest } = form;
      const updateData: Record<string, unknown> = { ...rest };
      // Only include password if user actually typed a new one
      if (password?.trim()) updateData.password = password;
      // Only include flat address fields if addressLine1 is provided (legacy compat)
      if (addressLine1?.trim()) {
        updateData.addressLine1 = addressLine1;
        if (addressType) updateData.addressType = addressType;
        if (addressLine2?.trim()) updateData.addressLine2 = addressLine2;
        if (landmark?.trim()) updateData.landmark = landmark;
        if (city?.trim()) updateData.city = city;
        if (district?.trim()) updateData.district = district;
        if (state?.trim()) updateData.state = state;
        if (country?.trim()) updateData.country = country;
        if (postalCode?.trim()) updateData.postalCode = postalCode;
      }
      updateMutation.mutate({ id: editingId, data: updateData as Partial<CreateDoctorWithUserInput> });
    } else {
      // Build create payload — use addresses array if any, else flat fields
      const validAddresses = addresses.filter((a) => a.addressLine1?.trim());
      const createData: CreateDoctorWithUserInput = {
        ...form as CreateDoctorWithUserInput,
        ...(validAddresses.length > 0
          ? { addresses: validAddresses.map((a, i) => ({ ...a, isPrimary: a.isPrimary ?? i === 0 })) }
          : {}),
      };
      createMutation.mutate(createData, {
        onSuccess: async (result: any) => {
          queryClient.invalidateQueries({ queryKey: ["doctors"] });
          closeSheet();
          toast.success("Doctor created successfully");
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
      id: "actions",
      header: () => <div className="text-center">Action</div>,
      cell: ({ row }) => {
        const doctor = row.original;
        return (
            <div className="flex justify-center gap-1">
              {doctor.isActive ? (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => openDocs(doctor)}>
                        <FileText className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Documents</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => { setScheduleDoctorId(doctor.id); setScheduleDoctorSpecialization(doctor.specialization ?? null); }}>
                        <CalendarClock className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Weekly Schedule</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => setAddressDoctorId(doctor.id)}>
                        <MapPin className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Addresses</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-9 text-primary" onClick={() => navigate({ to: "/appointments/new", search: { doctorId: doctor.id } })}>
                        <CalendarPlus className="size-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Book Appointment</TooltipContent>
                  </Tooltip>
                  {canUpdate && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(doctor.id)}>
                          <Pencil className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit Doctor</TooltipContent>
                    </Tooltip>
                  )}
                  {canDelete && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          onClick={() => setConfirmDialog({ open: true, doctor, action: 'deactivate' })}
                        >
                          <UserX className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Deactivate Doctor & Login</TooltipContent>
                    </Tooltip>
                  )}
                </>
              ) : canUpdate ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-green-600"
                      onClick={() => setConfirmDialog({ open: true, doctor, action: 'activate' })}
                    >
                      <UserCheck className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reactivate Doctor & Login</TooltipContent>
                </Tooltip>
              ) : null}
            </div>
        );
      },
    },
  ], [canUpdate, canDelete]);

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Doctors</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage doctor professional profiles, credentials, and verification</p>
        </div>
        <Sheet open={sheetOpen && (canCreate || !!editingId)} onOpenChange={setSheetOpen}>
          {canCreate && (
            <SheetTrigger asChild><Button onClick={openAdd}><Plus className="mr-2 size-4" />Add Doctor</Button></SheetTrigger>
          )}
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
                    <PasswordInput id="du-password" placeholder={editingId ? "Unchanged" : "Min 8 chars"} value={form.password ?? ""} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="du-mobile">Mobile Number *</FieldLabel>
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
                    <Input id="d-reg-year" type="text" inputMode="numeric" pattern="[0-9]*" placeholder="2015" value={form.registrationYear ?? ""} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setForm({ ...form, registrationYear: v ? Number(v) : undefined }); }} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="d-exp">Experience (yrs)</FieldLabel>
                    <Input id="d-exp" type="text" inputMode="numeric" pattern="[0-9]*" placeholder="10" value={form.yearsOfExperience ?? ""} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setForm({ ...form, yearsOfExperience: v ? Number(v) : undefined }); }} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="d-fee">Consultation Fee (₹)</FieldLabel>
                    <Input id="d-fee" type="text" inputMode="numeric" pattern="[0-9]*" placeholder="500" value={form.consultationFee ?? ""} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setForm({ ...form, consultationFee: v ? Number(v) : 0 }); }} />
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
                {/* ─── Addresses Section (optional, multiple) ─── */}
                <Separator className="my-2" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <MapPin className="size-4" />
                    <span>Addresses <span className="text-xs font-normal">(optional)</span></span>
                  </div>
                  {!editingId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAddresses((prev) => [...prev, { addressType: "CLINIC", addressLine1: "", city: "", state: "", country: "India", postalCode: "", isPrimary: prev.length === 0 }])}
                    >
                      <Plus className="mr-1 size-3.5" />Add
                    </Button>
                  )}
                </div>
                {!editingId && addresses.length === 0 && (
                  <p className="text-xs text-muted-foreground">No addresses added. You can add them after creation via the address manager.</p>
                )}
                {!editingId && addresses.map((addr, idx) => (
                  <div key={idx} className="relative rounded-md border p-3 space-y-2">
                    {addresses.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 size-6"
                        onClick={() => setAddresses((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <X className="size-3" />
                      </Button>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <Field>
                        <FieldLabel>Address Type</FieldLabel>
                        <Select value={addr.addressType ?? "CLINIC"} onValueChange={(v) => setAddresses((prev) => prev.map((a, i) => i === idx ? { ...a, addressType: v } : a))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CLINIC">Clinic</SelectItem>
                            <SelectItem value="HOME">Home</SelectItem>
                            <SelectItem value="BILLING">Billing</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field>
                        <FieldLabel>Address Line 1 *</FieldLabel>
                        <Input placeholder="123 Main Street" value={addr.addressLine1} onChange={(e) => setAddresses((prev) => prev.map((a, i) => i === idx ? { ...a, addressLine1: e.target.value } : a))} />
                      </Field>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Field>
                        <FieldLabel>City</FieldLabel>
                        <Input placeholder="Mumbai" value={addr.city ?? ""} onChange={(e) => setAddresses((prev) => prev.map((a, i) => i === idx ? { ...a, city: e.target.value } : a))} />
                      </Field>
                      <Field>
                        <FieldLabel>State</FieldLabel>
                        <Select value={addr.state ?? ""} onValueChange={(v) => setAddresses((prev) => prev.map((a, i) => i === idx ? { ...a, state: v } : a))}>
                          <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                          <SelectContent>
                            {INDIAN_STATES.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field>
                        <FieldLabel>Postal Code</FieldLabel>
                        <Input placeholder="400001" value={addr.postalCode ?? ""} onChange={(e) => setAddresses((prev) => prev.map((a, i) => i === idx ? { ...a, postalCode: e.target.value } : a))} />
                      </Field>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input type="radio" name="primaryAddr" className="size-3 accent-primary" checked={addr.isPrimary ?? idx === 0} onChange={() => setAddresses((prev) => prev.map((a, i) => ({ ...a, isPrimary: i === idx })))} />
                      Primary address
                    </label>
                  </div>
                ))}
                {editingId && (
                  <p className="text-xs text-muted-foreground">Addresses are managed via the address manager on the doctor list.</p>
                )}

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
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => removePending(realIdx)}>
                                  <X className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remove file</TooltipContent>
                            </Tooltip>
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

          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by specialization or registration number..."
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
                <Stethoscope className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">{search ? "No doctors found" : "No doctors registered yet"}</p>
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

            {/* ─── Day-by-day editor (multiple shift blocks per day) ─── */}
            {scheduleQuery.isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
            ) : (
              DAYS.map(({ value, label }) => {
                const day = scheduleForm[value];
                if (!day) return null;
                return (
                  <div key={value} className="rounded-none border p-3">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input type="checkbox" className="size-4 accent-primary" checked={day.enabled} onChange={(e) => setDayEnabled(value, e.target.checked)} />
                      {label}
                    </label>
                    {day.enabled && (
                      <div className="mt-3 space-y-3">
                        {day.blocks.map((block, blockIdx) => (
                          <div key={blockIdx} className="rounded-md border border-dashed p-2.5 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-muted-foreground">Shift {blockIdx + 1}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-6"
                                aria-label={`Remove shift ${blockIdx + 1} on ${label}`}
                                onClick={() => removeDayBlock(value, blockIdx)}
                              >
                                <X className="size-3" />
                              </Button>
                            </div>
                            {/* Shift picker for this block */}
                            {shifts.length > 0 && (
                              <Field>
                                <FieldLabel>Shift</FieldLabel>
                                <Select
                                  value={block.shiftId ?? "__custom__"}
                                  onValueChange={(shiftId) => {
                                    const selected = shiftId !== "__custom__" ? shifts.find((s) => s.id === shiftId) : undefined;
                                    updateDayBlock(value, blockIdx, selected
                                      ? { shiftId: selected.id, startTime: selected.startTime, endTime: selected.endTime }
                                      : { shiftId: undefined });
                                  }}
                                >
                                  <SelectTrigger className="h-9 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__custom__" className="text-xs">Custom times (no shift)</SelectItem>
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
                              <Field><FieldLabel htmlFor={`start-${value}-${blockIdx}`}>Start</FieldLabel><Input id={`start-${value}-${blockIdx}`} type="time" value={block.startTime} onChange={(e) => updateDayBlock(value, blockIdx, { startTime: e.target.value, shiftId: undefined })} /></Field>
                              <Field><FieldLabel htmlFor={`end-${value}-${blockIdx}`}>End</FieldLabel><Input id={`end-${value}-${blockIdx}`} type="time" value={block.endTime} onChange={(e) => updateDayBlock(value, blockIdx, { endTime: e.target.value, shiftId: undefined })} /></Field>
                            </div>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => addDayBlock(value)}
                        >
                          <Plus className="mr-1 size-3" /> Add another shift
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* ─── One-time schedule changes (date-specific) ─── */}
            <div className="rounded-lg border border-dashed border-amber-300/70 bg-amber-50/40 p-3">
              <p className="mb-1 text-xs font-semibold text-amber-800">One-time schedule changes</p>
              <p className="mb-3 text-[11px] leading-snug text-muted-foreground">
                Apply to a single calendar date only — recurring weekly shifts above are never touched.
              </p>

              {scheduleExceptionsQuery.isLoading ? (
                <p className="text-xs text-muted-foreground">Loading…</p>
              ) : upcomingExceptions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No upcoming one-time changes.</p>
              ) : (
                <ul className="space-y-1.5">
                  {upcomingExceptions.map((ex) => (
                    <li key={ex.id} className="flex items-center justify-between gap-2 rounded-md border bg-background px-2 py-1.5">
                      <div className="min-w-0 text-xs">
                        <span className="font-semibold">{EXCEPTION_TYPE_LABEL[ex.type]}</span>
                        <span className="text-muted-foreground"> · {new Date(ex.date + (ex.date.length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                        {ex.type !== "DAY_OFF" && (
                          <span className="text-muted-foreground"> · {ex.startTime}–{ex.endTime}{ex.shift?.name ? ` · ${ex.shift.name}` : ""}</span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 shrink-0"
                        aria-label="Delete one-time change"
                        disabled={deleteExceptionMutation.isPending}
                        onClick={() => deleteExceptionMutation.mutate(ex.id)}
                      >
                        <X className="size-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3 space-y-2 border-t border-amber-200/70 pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <Field>
                    <FieldLabel htmlFor="exc-type">Type</FieldLabel>
                    <Select
                      value={exceptionForm.type}
                      onValueChange={(v) => setExceptionForm((f) => ({ ...f, type: v as EmployeeScheduleExceptionType }))}
                    >
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EXTRA_SHIFT" className="text-xs">Extra shift</SelectItem>
                        <SelectItem value="OVERRIDE" className="text-xs">Override the day</SelectItem>
                        <SelectItem value="DAY_OFF" className="text-xs">Day off</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="exc-date">Date *</FieldLabel>
                    <Input
                      id="exc-date"
                      type="date"
                      className="h-9 text-xs"
                      min={toDateStr(new Date())}
                      value={exceptionForm.date}
                      onChange={(e) => setExceptionForm((f) => ({ ...f, date: e.target.value }))}
                    />
                  </Field>
                </div>
                {exceptionForm.type !== "DAY_OFF" && (
                  <div className="grid grid-cols-3 gap-2">
                    <Field>
                      <FieldLabel>Shift preset</FieldLabel>
                      <Select
                        value={exceptionForm.shiftId}
                        onValueChange={(shiftId) => {
                          const selected = shiftId ? shifts.find((s) => s.id === shiftId) : undefined;
                          setExceptionForm((f) => ({
                            ...f,
                            shiftId,
                            ...(selected ? { startTime: selected.startTime, endTime: selected.endTime } : {}),
                          }));
                        }}
                      >
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Custom" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="" className="text-xs">Custom</SelectItem>
                          {shifts.map((s) => (
                            <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel>Start</FieldLabel>
                      <Input type="time" className="h-9 text-xs" value={exceptionForm.startTime} onChange={(e) => setExceptionForm((f) => ({ ...f, startTime: e.target.value }))} />
                    </Field>
                    <Field>
                      <FieldLabel>End</FieldLabel>
                      <Input type="time" className="h-9 text-xs" value={exceptionForm.endTime} onChange={(e) => setExceptionForm((f) => ({ ...f, endTime: e.target.value }))} />
                    </Field>
                  </div>
                )}
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="w-full text-xs"
                  disabled={addExceptionMutation.isPending || scheduleExceptionsQuery.isLoading}
                  onClick={handleAddException}
                >
                  <Plus className="mr-1 size-3" /> Add one-time change
                </Button>
              </div>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => { setScheduleDoctorId(null); setScheduleDoctorSpecialization(null); }}>Cancel</Button>
            <Button onClick={() => saveScheduleMutation.mutate()} disabled={saveScheduleMutation.isPending}>Save Schedule</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ─── Deactivate / Activate confirmation dialog ─── */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.action === 'deactivate' ? 'Deactivate Doctor' : 'Reactivate Doctor'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.action === 'deactivate'
                ? `This will deactivate ${confirmDialog.doctor?.name ?? 'this doctor'} and disable their login. They will no longer be able to access the system.`
                : `This will reactivate ${confirmDialog.doctor?.name ?? 'this doctor'} and restore their login access.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                variant={confirmDialog.action === 'deactivate' ? 'destructive' : 'default'}
                onClick={() => {
                  if (confirmDialog.doctor) {
                    toggleActiveMutation.mutate({
                      id: confirmDialog.doctor.id,
                      isActive: confirmDialog.action === 'activate',
                    });
                  }
                }}
              >
                {confirmDialog.action === 'deactivate' ? 'Deactivate' : 'Reactivate'}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7 shrink-0 text-destructive" onClick={() => deleteMutation.mutate(doc.id)}>
                <X className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete document</TooltipContent>
          </Tooltip>
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => removePending(idx)}>
                <X className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove file</TooltipContent>
          </Tooltip>
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
