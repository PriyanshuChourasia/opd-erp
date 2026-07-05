import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
  Phone,
  Mail,
  Calendar,
  Droplets,
} from "lucide-react";
import { fetchPatients, fetchPatient, createPatient, updatePatient, deletePatient, type Patient, type CreatePatientInput } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";

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

export function PatientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState<CreatePatientInput>({
    name: "", phone: "", email: "", dateOfBirth: "", gender: "", bloodGroup: "", address: "", emergencyContact: "", allergies: [],
  });

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients", search],
    queryFn: () => fetchPatients(search || undefined),
  });

  const createMutation = useMutation({
    mutationFn: createPatient,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["patients"] }); closeSheet(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePatientInput> }) => updatePatient(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["patients"] }); closeSheet(); },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePatient,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["patients"] }); setDeleteConfirm(null); },
  });

  function openAdd() {
    setEditingId(null);
    setForm({ name: "", phone: "", email: "", dateOfBirth: "", gender: "", bloodGroup: "", address: "", emergencyContact: "", allergies: [] });
    setSheetOpen(true);
  }

  async function openEdit(id: string) {
    setEditingId(id);
    const patient = await queryClient.fetchQuery({ queryKey: ["patient", id], queryFn: () => fetchPatient(id) });
    setForm({
      name: patient.name, phone: patient.phone, email: patient.email ?? "", dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split("T")[0] ?? "" : "",
      gender: patient.gender ?? "", bloodGroup: patient.bloodGroup ?? "", address: patient.address ?? "", emergencyContact: patient.emergencyContact ?? "",
      allergies: patient.allergies ?? [],
    });
    setSheetOpen(true);
  }

  function closeSheet() { setSheetOpen(false); setEditingId(null); }

  function handleSave() {
    if (!form.name.trim() || !form.phone.trim()) return;
    if (editingId) updateMutation.mutate({ id: editingId, data: form });
    else createMutation.mutate(form);
  }

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
              <SheetDescription>{editingId ? "Update patient details below." : "Register a new patient."}</SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-4 px-4 pb-4">
              <FieldGroup>
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
                <Field><FieldLabel htmlFor="p-address">Address</FieldLabel><Input id="p-address" placeholder="123 Main St, City" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
                <Field><FieldLabel htmlFor="p-emergency">Emergency Contact</FieldLabel><Input id="p-emergency" placeholder="+1 555-000-0001" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} /></Field>
                <Field><FieldLabel htmlFor="p-allergies">Allergies (comma-separated)</FieldLabel><Input id="p-allergies" placeholder="Penicillin, Sulfa" value={(form.allergies ?? []).join(", ")} onChange={(e) => setForm({ ...form, allergies: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></Field>
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
            <Input placeholder="Search by name, phone, or email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><span className="text-sm text-muted-foreground">Loading...</span></div>
          ) : patients.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Users className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">{search ? "No patients found" : "No patients registered yet"}</p>
            </div>
          ) : (
            <div className="divide-y">
              {patients.map((patient) => (
                <div key={patient.id} className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Users className="size-4 text-primary" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{patient.name}</p>
                      {patient.bloodGroup && (
                        <Badge variant="outline" className={`text-[10px] uppercase ${bloodGroupColors[patient.bloodGroup] ?? ""}`}>
                          <Droplets className="mr-1 size-2.5" />{patient.bloodGroup}
                        </Badge>
                      )}
                      {patient.gender && <span className="text-xs text-muted-foreground">{patient.gender}</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Phone className="size-3" />{patient.phone}</span>
                      {patient.email && <span className="flex items-center gap-1"><Mail className="size-3" />{patient.email}</span>}
                      {patient.dateOfBirth && <span className="flex items-center gap-1"><Calendar className="size-3" />{new Date(patient.dateOfBirth).toLocaleDateString()}</span>}
                    </div>
                    {(patient.allergies ?? []).length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(patient.allergies ?? []).map((a: string) => (
                          <span key={a} className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(patient.id)}><Pencil className="size-3.5" /></Button>
                    {deleteConfirm === patient.id ? (
                      <div className="flex items-center gap-1">
                        <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => deleteMutation.mutate(patient.id)}>Confirm</Button>
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => setDeleteConfirm(null)}><X className="size-3.5" /></Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(patient.id)}><Trash2 className="size-3.5" /></Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
