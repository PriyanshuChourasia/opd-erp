import { useState } from "react";
import { Box, Layers, Pencil, Plus, Search, Terminal, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";

type ModuleStatus = "stable" | "beta" | "dev";
interface AppModule { id: string; name: string; description: string; status: ModuleStatus; version: string; dependencies: string[] }

const initialModules: AppModule[] = [
  { id: "m1", name: "Auth", description: "Authentication & Authorization — JWT, OTP, OAuth providers", status: "stable", version: "1.2.0", dependencies: ["Prisma"] },
  { id: "m2", name: "Patient Management", description: "Patient registration, profile management, medical history", status: "stable", version: "2.0.1", dependencies: ["Prisma"] },
  { id: "m3", name: "Appointments", description: "Appointment booking, scheduling, slot management, calendar", status: "stable", version: "1.5.3", dependencies: ["Doctor Schedules"] },
  { id: "m4", name: "Prescriptions", description: "E-prescriptions, medicine selection, dosage tracking", status: "beta", version: "0.9.0", dependencies: ["Medicine Catalog"] },
  { id: "m5", name: "Billing & POS", description: "Invoice generation, point-of-sale, discounts, refunds", status: "stable", version: "1.1.0", dependencies: ["Appointments"] },
  { id: "m6", name: "Medicine Catalog", description: "Drug master management, search, autocomplete", status: "stable", version: "1.0.0", dependencies: [] },
  { id: "m7", name: "Queue Management", description: "Token queue, status tracking, real-time updates", status: "stable", version: "1.3.0", dependencies: ["Appointments"] },
  { id: "m8", name: "Dispensing", description: "Pharmacy dispensing, partial fulfillment, stock tracking", status: "beta", version: "0.8.0", dependencies: ["Prescriptions"] },
];

const statusVariant: Record<ModuleStatus, "default" | "secondary" | "outline"> = { stable: "default", beta: "secondary", dev: "outline" };

export function DevelopmentModulesPage() {
  const [modules, setModules] = useState<AppModule[]>(initialModules);
  const [search, setSearch] = useState("");
  const [editingModule, setEditingModule] = useState<AppModule | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formStatus, setFormStatus] = useState<ModuleStatus>("dev");
  const [formVersion, setFormVersion] = useState("1.0.0");
  const [formDeps, setFormDeps] = useState("");

  const filtered = modules.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.description.toLowerCase().includes(search.toLowerCase()));

  function openAdd() { setEditingModule(null); setFormName(""); setFormDesc(""); setFormStatus("dev"); setFormVersion("1.0.0"); setFormDeps(""); setSheetOpen(true); }
  function openEdit(mod: AppModule) { setEditingModule(mod); setFormName(mod.name); setFormDesc(mod.description); setFormStatus(mod.status); setFormVersion(mod.version); setFormDeps(mod.dependencies.join(", ")); setSheetOpen(true); }
  function handleSave() {
    if (!formName.trim()) return;
    const deps = formDeps.split(",").map((d) => d.trim()).filter(Boolean);
    if (editingModule) setModules((prev) => prev.map((m) => m.id === editingModule.id ? { ...m, name: formName.trim(), description: formDesc.trim(), status: formStatus, version: formVersion, dependencies: deps } : m));
    else setModules((prev) => [...prev, { id: `m${Date.now()}`, name: formName.trim(), description: formDesc.trim(), status: formStatus, version: formVersion, dependencies: deps }]);
    setSheetOpen(false); setEditingModule(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight">Application Modules</h1><p className="mt-1 text-sm text-muted-foreground">Create, edit, and manage all backend application modules</p></div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild><Button><Plus className="mr-2 size-4" />Add Module</Button></SheetTrigger>
          <SheetContent side="right" className="sm:max-w-md"><SheetHeader><SheetTitle>{editingModule ? "Edit Module" : "Add Module"}</SheetTitle><SheetDescription>{editingModule ? "Update the module details below." : "Register a new application module."}</SheetDescription></SheetHeader>
            <div className="flex-1 space-y-4 px-4"><FieldGroup>
              <Field><FieldLabel htmlFor="mod-name">Module Name</FieldLabel><Input id="mod-name" placeholder="e.g. Auth, Patients, Billing" value={formName} onChange={(e) => setFormName(e.target.value)} /></Field>
              <Field><FieldLabel htmlFor="mod-desc">Description</FieldLabel><Input id="mod-desc" placeholder="Brief description" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} /></Field>
              <Field><FieldLabel htmlFor="mod-status">Status</FieldLabel>
                <select id="mod-status" className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm" value={formStatus} onChange={(e) => setFormStatus(e.target.value as ModuleStatus)}>
                  <option value="stable">Stable</option><option value="beta">Beta</option><option value="dev">Dev</option>
                </select>
              </Field>
              <Field><FieldLabel htmlFor="mod-version">Version</FieldLabel><Input id="mod-version" placeholder="e.g. 1.0.0" value={formVersion} onChange={(e) => setFormVersion(e.target.value)} /></Field>
              <Field><FieldLabel htmlFor="mod-deps">Dependencies</FieldLabel><Input id="mod-deps" placeholder="Comma-separated: Prisma, JWT" value={formDeps} onChange={(e) => setFormDeps(e.target.value)} /></Field>
            </FieldGroup></div>
            <SheetFooter><Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={!formName.trim()}>{editingModule ? "Save Changes" : "Create Module"}</Button></SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      <Card><CardHeader className="pb-3"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search modules by name or description..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div></CardHeader>
        <CardContent className="p-0">{filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center"><Box className="size-8 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">No modules found</p></div>
        ) : (
          <div className="divide-y">{filtered.map((mod) => (
            <div key={mod.id} className="group flex items-start gap-4 px-6 py-4 transition-colors hover:bg-muted/50">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-none bg-primary/10"><Box className="size-4 text-primary" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><p className="text-sm font-medium">{mod.name}</p><Badge variant={statusVariant[mod.status]} className={mod.status === "stable" ? "bg-green-600/10 text-green-600 hover:bg-green-600/10" : mod.status === "beta" ? "bg-amber-600/10 text-amber-600 hover:bg-amber-600/10" : ""}>{mod.status}</Badge></div>
                <p className="mt-0.5 text-xs text-muted-foreground">{mod.description}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Terminal className="size-3" />v{mod.version}</span>{mod.dependencies.length > 0 && <span className="flex items-center gap-1"><Layers className="size-3" />{mod.dependencies.join(", ")}</span>}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(mod)}><Pencil className="size-3.5" /></Button>
                {deleteConfirm === mod.id ? (
                  <div className="flex items-center gap-1"><Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => { setModules((prev) => prev.filter((m) => m.id !== mod.id)); setDeleteConfirm(null); }}>Confirm</Button><Button variant="ghost" size="icon" className="size-8" onClick={() => setDeleteConfirm(null)}><X className="size-3.5" /></Button></div>
                ) : (<Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(mod.id)}><Trash2 className="size-3.5" /></Button>)}
              </div>
            </div>
          ))}</div>
        )}</CardContent>
      </Card>
    </div>
  );
}
