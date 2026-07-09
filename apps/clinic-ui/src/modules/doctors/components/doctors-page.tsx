import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { CalendarClock, Link2, Link2Off, MapPin, Pencil, Plus, Search, Stethoscope, Trash2, X, Award, BadgeCheck, DollarSign, ShieldCheck, GraduationCap, User } from "lucide-react";
import { AddressManager } from "@/modules/addresses/components/address-manager";
import { fetchDoctors, fetchDoctor, createDoctorWithUser, updateDoctor, deleteDoctor, linkDoctorToUser, type Doctor, type CreateDoctorInput, type CreateDoctorWithUserInput } from "@/lib/api";
import { fetchDoctorSchedules, createEmployeeSchedule, deleteEmployeeSchedule } from "../data/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCredentials } from "@/store/auth-slice";
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
import { DAYS, type DayForm } from "../data/interface";

function emptyScheduleForm(): DayForm[] {
  return DAYS.map(() => ({ enabled: false, startTime: "09:00", endTime: "17:00" }));
}

export function DoctorsPage() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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
    queryKey: ["doctors", search, pagination.pageIndex, pagination.pageSize],
    queryFn: () => fetchDoctors({
      search: search || undefined,
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
    }),
    placeholderData: (previous) => previous,
  });

  const doctors = response?.data ?? [];
  const pageCount = response?.meta.totalPages ?? 0;

  const createMutation = useMutation({
    mutationFn: createDoctorWithUser,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["doctors"] }); closeSheet(); },
    onError: (err) => { console.error('Failed to create doctor with user:', err); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDoctorInput> }) => updateDoctor(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["doctors"] }); closeSheet(); },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteDoctor,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["doctors"] }); setDeleteConfirm(null); },
  });

  const linkMutation = useMutation({
    mutationFn: linkDoctorToUser,
    onSuccess: (data) => {
      dispatch(setCredentials({ accessToken: localStorage.getItem("clinic_access_token") ?? "", user: data }));
    },
    onError: (err) => {
      console.error('Failed to link doctor profile:', err);
    },
  });

  const isLinkedToDoctor = useCallback(
    (doctorId: string) => currentUser?.userableType === 'Doctor' && currentUser?.userableId === doctorId,
    [currentUser],
  );

  const [scheduleDoctorId, setScheduleDoctorId] = useState<string | null>(null);
  const [addressDoctorId, setAddressDoctorId] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState<DayForm[]>(emptyScheduleForm());

  const scheduleQuery = useQuery({
    queryKey: ["employee-schedules", "Doctor", scheduleDoctorId],
    queryFn: () => fetchDoctorSchedules(scheduleDoctorId!),
    enabled: !!scheduleDoctorId,
  });

  useEffect(() => {
    if (!scheduleDoctorId) return;
    const next = emptyScheduleForm();
    for (const s of scheduleQuery.data ?? []) {
      next[s.dayOfWeek] = { enabled: true, id: s.id, startTime: s.startTime, endTime: s.endTime };
    }
    setScheduleForm(next);
  }, [scheduleDoctorId, scheduleQuery.data]);

  const saveScheduleMutation = useMutation({
    mutationFn: async () => {
      if (!scheduleDoctorId) return;
      await Promise.all(scheduleForm.map((day, dayOfWeek) => {
        if (day.enabled) return createEmployeeSchedule({
          employeeSchedulableType: 'Doctor',
          employeeSchedulableId: scheduleDoctorId,
          dayOfWeek,
          startTime: day.startTime,
          endTime: day.endTime,
        });
        if (day.id) return deleteEmployeeSchedule(day.id);
        return Promise.resolve(undefined);
      }));
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["employee-schedules", "Doctor", scheduleDoctorId] }); setScheduleDoctorId(null); },
  });

  function updateDay(dayOfWeek: number, patch: Partial<DayForm>) {
    setScheduleForm((prev) => prev.map((day, i) => (i === dayOfWeek ? { ...day, ...patch } : day)));
  }

  function openAdd() {
    setEditingId(null);
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
    const doctor = await queryClient.fetchQuery({ queryKey: ["doctor", id], queryFn: () => fetchDoctor(id) });
    setForm({
      specialization: doctor.specialization ?? "",
      medicalRegistrationNo: doctor.medicalRegistrationNo,
      consultationFee: doctor.consultationFee,
      qualification: doctor.qualification ?? undefined,
      medicalCouncil: doctor.medicalCouncil ?? undefined,
      registrationYear: doctor.registrationYear ?? undefined,
      yearsOfExperience: doctor.yearsOfExperience ?? undefined,
      consultationMode: doctor.consultationMode,
      verificationStatus: doctor.verificationStatus,
    });
    setSheetOpen(true);
  }

  function closeSheet() { setSheetOpen(false); setEditingId(null); }

  function handleSave() {
    if (!form.medicalRegistrationNo.trim()) return;
    if (editingId) {
      // Editing: only doctor fields
      const { firstName: _f, lastName: _l, email: _e, username: _u, password: _p, mobileNumber: _m, addressType: _at, addressLine1: _a1, addressLine2: _a2, landmark: _lm, city: _c, district: _d, state: _s, country: _co, postalCode: _po, middleName: _mn, ...doctorOnly } = form as any;
      updateMutation.mutate({ id: editingId, data: doctorOnly });
    } else {
      // Creating: all fields
      createMutation.mutate(form as CreateDoctorWithUserInput);
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
              <p className="truncate font-medium">Doctor (ID: {doctor.id.slice(0, 8)})</p>
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
        const status = row.original.verificationStatus;
        if (status === 'VERIFIED') return <Badge variant="default" className="bg-green-600/10 text-green-600 text-[10px]"><BadgeCheck className="mr-1 size-2.5" />Verified</Badge>;
        if (status === 'REJECTED') return <Badge variant="destructive" className="text-[10px]">Rejected</Badge>;
        if (status === 'SUSPENDED') return <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-600">Suspended</Badge>;
        return <Badge variant="secondary" className="text-[10px]">Pending</Badge>;
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const doctor = row.original;
        const linked = isLinkedToDoctor(doctor.id);
        return (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" className="size-8" title="Weekly schedule" onClick={() => setScheduleDoctorId(doctor.id)}>
              <CalendarClock className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8" title="Addresses" onClick={() => setAddressDoctorId(doctor.id)}>
              <MapPin className="size-3.5" />
            </Button>
            {linked ? (
              <Button variant="ghost" size="icon" className="size-8 text-emerald-600" title="Linked to your profile" disabled>
                <Link2 className="size-3.5" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="size-8" title="Link to my profile" onClick={() => linkMutation.mutate(doctor.id)} disabled={linkMutation.isPending}>
                <Link2 className="size-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(doctor.id)}>
              <Pencil className="size-3.5" />
            </Button>
            {deleteConfirm === doctor.id ? (
              <div className="flex items-center gap-1">
                <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => deleteMutation.mutate(doctor.id)}>Confirm</Button>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => setDeleteConfirm(null)}><X className="size-3.5" /></Button>
              </div>
            ) : (
              <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(doctor.id)}>
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
                {/* ─── User Account Section (add only) ─── */}
                {!editingId && (
                  <>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <User className="size-4" />
                      <span>User Account</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field>
                        <FieldLabel htmlFor="du-first">First Name *</FieldLabel>
                        <Input id="du-first" placeholder="John" value={form.firstName ?? ""} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="du-last">Last Name *</FieldLabel>
                        <Input id="du-last" placeholder="Doe" value={form.lastName ?? ""} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                      </Field>
                    </div>
                    <Field>
                      <FieldLabel htmlFor="du-email">Email *</FieldLabel>
                      <Input id="du-email" type="email" placeholder="doctor@clinic.com" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field>
                        <FieldLabel htmlFor="du-username">Username *</FieldLabel>
                        <Input id="du-username" placeholder="drjohndoe" value={form.username ?? ""} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="du-password">Password *</FieldLabel>
                        <Input id="du-password" type="password" placeholder="Min 8 chars" value={form.password ?? ""} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                      </Field>
                    </div>
                    <Field>
                      <FieldLabel htmlFor="du-mobile">Mobile Number</FieldLabel>
                      <Input id="du-mobile" placeholder="+919810000001" value={form.mobileNumber ?? ""} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} />
                    </Field>
                    <Separator className="my-2" />
                  </>
                )}

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

                {/* ─── Address Section (add only, optional) ─── */}
                {!editingId && (
                  <>
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
                  </>
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
        <CardHeader className="pb-3">
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

      <Sheet open={!!scheduleDoctorId} onOpenChange={(open) => !open && setScheduleDoctorId(null)}>
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>Weekly Schedule</SheetTitle><SheetDescription>Set working hours per day. Appointment slots are generated from these hours.</SheetDescription></SheetHeader>
          <div className="flex-1 space-y-3 px-4 pb-4">
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
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-2">
                        <Field><FieldLabel htmlFor={`start-${value}`}>Start</FieldLabel><Input id={`start-${value}`} type="time" value={day.startTime} onChange={(e) => updateDay(value, { startTime: e.target.value })} /></Field>
                        <Field><FieldLabel htmlFor={`end-${value}`}>End</FieldLabel><Input id={`end-${value}`} type="time" value={day.endTime} onChange={(e) => updateDay(value, { endTime: e.target.value })} /></Field>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setScheduleDoctorId(null)}>Cancel</Button>
            <Button onClick={() => saveScheduleMutation.mutate()} disabled={saveScheduleMutation.isPending}>Save Schedule</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
