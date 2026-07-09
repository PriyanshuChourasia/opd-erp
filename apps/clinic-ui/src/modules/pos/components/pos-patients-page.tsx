import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cake, ChevronDown, ChevronRight, Droplet, Mail, Pencil, Phone, Plus, Search, Users } from "lucide-react";
import { fetchAppointments } from "@/lib/api";
import { searchPatients } from "../data/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PatientFormSheet } from "@/modules/patients/components/patient-form-sheet";
import { APPT_STATUS_STYLES, currency } from "../data/interface";

export function PosPatientsPage() {
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: patients = [], isLoading } = useQuery({ queryKey: ["patients", search], queryFn: () => searchPatients(search || "") });

  const historyQuery = useQuery({ queryKey: ["appointments", "patient", expandedId], queryFn: () => fetchAppointments({ patientId: expandedId!, limit: 50 }), enabled: !!expandedId });
  const history = historyQuery.data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div><h1 className="text-xl font-semibold tracking-tight">Patients</h1><p className="mt-1 text-sm text-muted-foreground">Search, register, and review patient history</p></div>
        <Button onClick={() => { setEditingPatient(null); setSheetOpen(true); }}><Plus className="mr-2 size-4" />New Patient</Button>
      </div>
      <Card><CardHeader className="pb-3"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search by name, phone, or email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div></CardHeader>
        <CardContent className="p-0">{isLoading ? (<div className="flex justify-center py-12"><span className="text-sm text-muted-foreground">Loading...</span></div>) : patients.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center"><Users className="size-8 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">{search ? "No patients found" : "No patients registered yet"}</p></div>
        ) : (
          <div className="divide-y">{patients.map((patient: any) => {
            const expanded = expandedId === patient.id;
            return (<div key={patient.id}>
              <button type="button" className="group flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-muted/50" onClick={() => setExpandedId(expanded ? null : patient.id)}>
                {expanded ? <ChevronDown className="size-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10"><Users className="size-4 text-primary" /></span>
                <div className="min-w-0 flex-1"><p className="text-sm font-medium">{patient.name}</p><div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Phone className="size-3" />{patient.phone}</span>
                  {patient.email && <span className="flex items-center gap-1"><Mail className="size-3" />{patient.email}</span>}
                  {patient.dateOfBirth && <span className="flex items-center gap-1"><Cake className="size-3" />{new Date(patient.dateOfBirth).toLocaleDateString()}</span>}
                  {patient.bloodGroup && <span className="flex items-center gap-1"><Droplet className="size-3" />{patient.bloodGroup}</span>}
                </div></div>
                <span role="button" tabIndex={0} className="flex size-8 shrink-0 items-center justify-center rounded-none opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); setEditingPatient(patient); setSheetOpen(true); }}><Pencil className="size-3.5" /></span>
              </button>
              {expanded && (<div className="border-t bg-muted/20 px-6 py-4 pl-16"><p className="mb-2 text-xs font-medium text-muted-foreground">Appointment history</p>
                {historyQuery.isLoading ? (<p className="text-sm text-muted-foreground">Loading...</p>) : history.length === 0 ? (<p className="text-sm text-muted-foreground">No appointments yet.</p>) : (
                  <ul className="space-y-2">{history.map((appt: any) => (
                    <li key={appt.id} className="flex items-center justify-between text-sm">
                      <div className="min-w-0"><span className="font-medium">Dr. {appt.doctor.name}</span> <span className="text-muted-foreground">· {appt.type.replace("_", " ")} · {new Date(appt.date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span></div>
                      <div className="flex shrink-0 items-center gap-2"><span className="text-muted-foreground">{currency(appt.fee)}</span><Badge variant="outline" className={`text-[10px] ${APPT_STATUS_STYLES[appt.status] ?? ""}`}>{appt.status.replace("_", " ")}</Badge></div>
                    </li>
                  ))}</ul>
                )}
              </div>)}
            </div>);
          })}</div>
        )}</CardContent>
      </Card>
      <PatientFormSheet open={sheetOpen} onOpenChange={setSheetOpen} editingPatient={editingPatient} />
    </div>
  );
}
