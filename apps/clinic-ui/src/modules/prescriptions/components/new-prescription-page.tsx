import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { Plus, Search, X, Pill } from "lucide-react";
import {
  createPrescription,
  fetchPatients,
  fetchDoctors,
  fetchMedicines,
  getPatientName,
  type Medicine,
} from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prescriptionsListRoute } from "../lib/prescription-routes";

interface NewRxItem {
  tempId: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  duration: string;
  instructions: string;
  quantity: number;
}

export function NewPrescriptionPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const backTo = prescriptionsListRoute(location.pathname);

  const user = useAppSelector((state) => state.auth.user);
  const isDoctor = user?.userableType === "Doctor";

  const [patientSearch, setPatientSearch] = useState("");
  const [patient, setPatient] = useState<{ id: string; firstName: string; middleName?: string | null; lastName: string; contactNo: string } | null>(null);
  const [doctorId, setDoctorId] = useState(isDoctor ? (user?.userableId ?? "") : "");
  const [doctorQuery, setDoctorQuery] = useState("");
  const [doctorSearchOpen, setDoctorSearchOpen] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<NewRxItem[]>([]);
  const [medicineQuery, setMedicineQuery] = useState("");
  const [showMedicineSearch, setShowMedicineSearch] = useState(false);

  const patientResults = useQuery({
    queryKey: ["create-rx-patients", patientSearch],
    queryFn: () => fetchPatients({ search: patientSearch, limit: 8 }),
    enabled: patientSearch.trim().length >= 1 && !patient,
  });

  const { data: doctorsResponse } = useQuery({
    queryKey: ["doctors", "prescriptions-create"],
    queryFn: () => fetchDoctors({ limit: 100 }),
    enabled: !isDoctor,
  });
  const doctors = doctorsResponse?.data ?? [];
  const filteredDoctors = doctors.filter((d) =>
    !doctorQuery.trim() ||
    (d.name ?? d.medicalRegistrationNo ?? "").toLowerCase().includes(doctorQuery.trim().toLowerCase()) ||
    (d.specialization ?? "").toLowerCase().includes(doctorQuery.trim().toLowerCase())
  );

  const medicineResults = useQuery({
    queryKey: ["medicines", "search", "rx-create", medicineQuery],
    queryFn: () => fetchMedicines({ search: medicineQuery, limit: 20 }),
    enabled: medicineQuery.trim().length >= 2,
  });
  const medicines = medicineResults.data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: () =>
      createPrescription({
        patientId: patient!.id,
        doctorId,
        diagnosis: diagnosis || undefined,
        notes: notes || undefined,
        items: items.map((item) => ({
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          dosage: item.dosage,
          duration: item.duration || undefined,
          instructions: item.instructions || undefined,
          quantity: item.quantity,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      toast.success("Prescription created successfully");
      navigate({ to: backTo });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  function addMedicine(med: Medicine) {
    setItems((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        medicineId: med.id,
        medicineName: [med.brandName ?? med.name, med.strength].filter(Boolean).join(" "),
        dosage: "1-0-1",
        duration: "7 days",
        instructions: "",
        quantity: 1,
      },
    ]);
    setMedicineQuery("");
    setShowMedicineSearch(false);
  }

  function updateItem(tempId: string, patch: Partial<NewRxItem>) {
    setItems((prev) => prev.map((i) => (i.tempId === tempId ? { ...i, ...patch } : i)));
  }

  const canSubmit = !!patient && !!doctorId && items.length > 0;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create Prescription</h1>
          <p className="mt-1 text-sm text-muted-foreground">Search patient, select doctor, add diagnosis and medicines.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate({ to: backTo })}>Cancel</Button>
          <Button disabled={!canSubmit || createMutation.isPending} onClick={() => createMutation.mutate()}>
            {createMutation.isPending ? "Creating..." : "Create Prescription"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left: Patient + Doctor ── */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Patient *</CardTitle></CardHeader>
            <CardContent>
              {patient ? (
                <div className="flex items-center justify-between rounded-none border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{getPatientName(patient)}</p>
                    <p className="text-xs text-muted-foreground">{patient.contactNo}</p>
                  </div>
                  <Button variant="ghost" size="icon-sm" onClick={() => { setPatient(null); setPatientSearch(""); }}><X className="size-4" /></Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search patient by name or phone..." className="pl-9" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} />
                  {patientSearch.trim().length >= 1 && (
                    <div className="absolute z-10 mt-1 w-full rounded-none border bg-popover shadow-md max-h-56 overflow-y-auto">
                      {patientResults.isLoading && <p className="px-3 py-2 text-xs text-muted-foreground">Searching...</p>}
                      {!patientResults.isLoading && (patientResults.data?.data ?? []).length === 0 && (
                        <p className="px-3 py-2 text-xs text-muted-foreground">No patients found</p>
                      )}
                      {(patientResults.data?.data ?? []).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                          onClick={() => { setPatient({ id: p.id, firstName: p.firstName, middleName: p.middleName, lastName: p.lastName, contactNo: p.contactNo }); setPatientSearch(""); }}
                        >
                          <span className="font-medium">{getPatientName(p)}</span>
                          <span className="text-xs text-muted-foreground">{p.contactNo}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Doctor *</CardTitle></CardHeader>
            <CardContent>
              {isDoctor ? (
                <div className="flex items-center rounded-none border px-3 py-2 bg-muted/30">
                  <span className="text-sm font-medium text-muted-foreground">You (auto-assigned)</span>
                </div>
              ) : doctorId ? (
                <div className="flex items-center justify-between rounded-none border px-3 py-2">
                  <span className="text-sm font-medium">{doctors.find((d) => d.id === doctorId)?.name ?? doctors.find((d) => d.id === doctorId)?.medicalRegistrationNo ?? "Doctor"}</span>
                  <Button variant="ghost" size="icon-sm" onClick={() => setDoctorId("")}><X className="size-4" /></Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search doctor by name or specialization..."
                    className="pl-9"
                    value={doctorQuery}
                    onChange={(e) => { setDoctorQuery(e.target.value); setDoctorSearchOpen(true); }}
                    onFocus={() => setDoctorSearchOpen(true)}
                    onBlur={() => setTimeout(() => setDoctorSearchOpen(false), 200)}
                  />
                  {doctorSearchOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-none border bg-popover shadow-md max-h-56 overflow-y-auto">
                      {filteredDoctors.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-muted-foreground">No doctors found</p>
                      ) : (
                        filteredDoctors.map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted"
                            onMouseDown={() => { setDoctorId(d.id); setDoctorSearchOpen(false); setDoctorQuery(""); }}
                          >
                            <span className="font-medium">{d.name ?? d.medicalRegistrationNo}</span>
                            {d.specialization && <span className="text-xs text-muted-foreground">{d.specialization}</span>}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Diagnosis, medicines, notes ── */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Diagnosis</CardTitle></CardHeader>
            <CardContent>
              <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Hypertension, Diabetes..." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Medicines</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowMedicineSearch(true)}>
                <Pill className="mr-1 size-3" />Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {showMedicineSearch && (
                <div className="rounded-none border p-2 space-y-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search medicine..." className="pl-9 h-8 text-xs" autoFocus value={medicineQuery} onChange={(e) => setMedicineQuery(e.target.value)} />
                  </div>
                  {medicineQuery.trim().length >= 2 && (
                    <div className="max-h-40 overflow-y-auto rounded-none border bg-popover">
                      {medicines.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-muted-foreground">No medicines found</p>
                      ) : (
                        medicines.map((med) => (
                          <button
                            key={med.id}
                            type="button"
                            className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-muted"
                            onClick={() => addMedicine(med)}
                          >
                            <span><span className="font-medium">{med.brandName}</span> {med.strength && <span className="text-muted-foreground">{med.strength}</span>}</span>
                            <Plus className="size-3 text-muted-foreground" />
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setShowMedicineSearch(false); setMedicineQuery(""); }}>Cancel</Button>
                </div>
              )}
              {items.length === 0 ? (
                <p className="py-2 text-center text-xs text-muted-foreground">No medicines added</p>
              ) : (
                items.map((item) => (
                  <div key={item.tempId} className="space-y-1.5 rounded-none border px-2 py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium truncate">{item.medicineName}</p>
                      <Button variant="ghost" size="icon" className="size-5 shrink-0" title="Remove item" onClick={() => setItems((p) => p.filter((i) => i.tempId !== item.tempId))}>
                        <X className="size-3 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <Input className="h-7 text-[11px]" placeholder="Dosage" value={item.dosage} onChange={(e) => updateItem(item.tempId, { dosage: e.target.value })} />
                      <Input className="h-7 text-[11px]" placeholder="Duration" value={item.duration} onChange={(e) => updateItem(item.tempId, { duration: e.target.value })} />
                      <Input className="h-7 text-[11px]" type="number" min={1} placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(item.tempId, { quantity: Number(e.target.value) || 1 })} />
                    </div>
                    <Input className="h-7 text-[11px]" placeholder="Instructions (optional)" value={item.instructions} onChange={(e) => updateItem(item.tempId, { instructions: e.target.value })} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
            <CardContent>
              <Input placeholder="Optional" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
