import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Pencil, Plus, Search, Stethoscope, Trash2, X, Mail, Phone, Award, BadgeCheck } from "lucide-react";
import { fetchDoctors, fetchDoctor, createDoctor, updateDoctor, deleteDoctor, fetchDoctorSchedules, upsertDoctorSchedule, deleteDoctorSchedule, type CreateDoctorInput } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { DAYS, type DayForm } from "../data/interface";

function emptyScheduleForm(): DayForm[] {
  return DAYS.map(() => ({ enabled: false, startTime: "09:00", endTime: "17:00", slotDuration: 15, maxPatients: 1 }));
}

export function DoctorsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState<CreateDoctorInput>({ name: "", email: "", phone: "", specialization: "", licenseNumber: "" });

  const { data: doctors = [], isLoading } = useQuery({ queryKey: ["doctors", search], queryFn: () => fetchDoctors(search || undefined) });

  const createMutation = useMutation({
    mutationFn: createDoctor,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["doctors"] }); closeSheet(); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDoctorInput> }) => updateDoctor(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["doctors"] }); closeSheet(); },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteDoctor,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["doctors"] }); setDeleteConfirm(null); },
  });

  const [scheduleDoctorId, setScheduleDoctorId] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState<DayForm[]>(emptyScheduleForm());

  const scheduleQuery = useQuery({
    queryKey: ["doctor-schedules", scheduleDoctorId],
    queryFn: () => fetchDoctorSchedules(scheduleDoctorId!),
    enabled: !!scheduleDoctorId,
  });

  useEffect(() => {
    if (!scheduleDoctorId) return;
    const next = emptyScheduleForm();
    for (const s of scheduleQuery.data ?? []) {
      next[s.dayOfWeek] = { enabled: true, id: s.id, startTime: s.startTime, endTime: s.endTime, slotDuration: s.slotDuration, maxPatients: s.maxPatients };
    }
    setScheduleForm(next);
  }, [scheduleDoctorId, scheduleQuery.data]);

  const saveScheduleMutation = useMutation({
    mutationFn: async () => {
      if (!scheduleDoctorId) return;
      await Promise.all(scheduleForm.map((day, dayOfWeek) => {
        if (day.enabled) return upsertDoctorSchedule({ doctorId: scheduleDoctorId, dayOfWeek, startTime: day.startTime, endTime: day.endTime, slotDuration: day.slotDuration, maxPatients: day.maxPatients });
        if (day.id) return deleteDoctorSchedule(day.id);
        return Promise.resolve(undefined);
      }));
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["doctor-schedules", scheduleDoctorId] }); setScheduleDoctorId(null); },
  });

  function updateDay(dayOfWeek: number, patch: Partial<DayForm>) {
    setScheduleForm((prev) => prev.map((day, i) => (i === dayOfWeek ? { ...day, ...patch } : day)));
  }

  function openAdd() { setEditingId(null); setForm({ name: "", email: "", phone: "", specialization: "", licenseNumber: "" }); setSheetOpen(true); }

  async function openEdit(id: string) {
    setEditingId(id);
    const doctor = await queryClient.fetchQuery({ queryKey: ["doctor", id], queryFn: () => fetchDoctor(id) });
    setForm({ name: doctor.name, email: doctor.email, phone: doctor.phone ?? "", specialization: doctor.specialization ?? "", licenseNumber: doctor.licenseNumber });
    setSheetOpen(true);
  }

  function closeSheet() { setSheetOpen(false); setEditingId(null); }

  function handleSave() {
    if (!form.name.trim() || !form.email.trim() || !form.licenseNumber.trim()) return;
    if (editingId) updateMutation.mutate({ id: editingId, data: form });
    else createMutation.mutate(form);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Doctors</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage doctor profiles, specializations, and licenses</p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild><Button onClick={openAdd}><Plus className="mr-2 size-4" />Add Doctor</Button></SheetTrigger>
          <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
            <SheetHeader><SheetTitle>{editingId ? "Edit Doctor" : "Add Doctor"}</SheetTitle><SheetDescription>{editingId ? "Update doctor details below." : "Register a new doctor."}</SheetDescription></SheetHeader>
            <div className="flex-1 space-y-4 px-4 pb-4">
              <FieldGroup>
                <Field><FieldLabel htmlFor="d-name">Full Name *</FieldLabel><Input id="d-name" placeholder="Dr. Sarah Chen" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <Field><FieldLabel htmlFor="d-email">Email *</FieldLabel><Input id="d-email" type="email" placeholder="sarah.chen@clinic.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <div className="flex gap-3">
                  <Field className="flex-1"><FieldLabel htmlFor="d-phone">Phone</FieldLabel><Input id="d-phone" placeholder="+1 555-000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
                  <Field className="flex-1"><FieldLabel htmlFor="d-specialization">Specialization</FieldLabel><Input id="d-specialization" placeholder="Cardiology" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} /></Field>
                </div>
                <Field><FieldLabel htmlFor="d-license">License Number *</FieldLabel><Input id="d-license" placeholder="MD-12345" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} /></Field>
              </FieldGroup>
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={closeSheet}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.name.trim() || !form.email.trim() || !form.licenseNumber.trim() || createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Save Changes" : "Create Doctor"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search by name, specialization, or license..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><span className="text-sm text-muted-foreground">Loading...</span></div>
          ) : doctors.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center"><Stethoscope className="size-8 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">{search ? "No doctors found" : "No doctors registered yet"}</p></div>
          ) : (
            <div className="divide-y">
              {doctors.map((doctor) => (
                <div key={doctor.id} className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10"><Stethoscope className="size-4 text-primary" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{doctor.name}</p>
                      {doctor.isActive ? <Badge variant="default" className="bg-green-600/10 text-green-600 text-[10px]"><BadgeCheck className="mr-1 size-2.5" />Active</Badge> :
                        <Badge variant="outline" className="text-[10px]">Inactive</Badge>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {doctor.specialization && <span className="flex items-center gap-1"><Award className="size-3" />{doctor.specialization}</span>}
                      <span className="flex items-center gap-1"><Mail className="size-3" />{doctor.email}</span>
                      {doctor.phone && <span className="flex items-center gap-1"><Phone className="size-3" />{doctor.phone}</span>}
                      <span className="flex items-center gap-1"><BadgeCheck className="size-3" />{doctor.licenseNumber}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="ghost" size="icon" className="size-8" title="Weekly schedule" onClick={() => setScheduleDoctorId(doctor.id)}><CalendarClock className="size-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(doctor.id)}><Pencil className="size-3.5" /></Button>
                    {deleteConfirm === doctor.id ? (
                      <div className="flex items-center gap-1">
                        <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => deleteMutation.mutate(doctor.id)}>Confirm</Button>
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => setDeleteConfirm(null)}><X className="size-3.5" /></Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(doctor.id)}><Trash2 className="size-3.5" /></Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <Field><FieldLabel htmlFor={`start-${value}`}>Start</FieldLabel><Input id={`start-${value}`} type="time" value={day.startTime} onChange={(e) => updateDay(value, { startTime: e.target.value })} /></Field>
                        <Field><FieldLabel htmlFor={`end-${value}`}>End</FieldLabel><Input id={`end-${value}`} type="time" value={day.endTime} onChange={(e) => updateDay(value, { endTime: e.target.value })} /></Field>
                        <Field><FieldLabel htmlFor={`slot-${value}`}>Slot (min)</FieldLabel><Input id={`slot-${value}`} type="number" min={5} value={day.slotDuration} onChange={(e) => updateDay(value, { slotDuration: Number(e.target.value) || 5 })} /></Field>
                        <Field><FieldLabel htmlFor={`cap-${value}`}>Per slot</FieldLabel><Input id={`cap-${value}`} type="number" min={1} value={day.maxPatients} onChange={(e) => updateDay(value, { maxPatients: Number(e.target.value) || 1 })} /></Field>
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
