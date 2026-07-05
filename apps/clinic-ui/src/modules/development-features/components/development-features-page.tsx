import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Minus, Pencil, Plus, Search, ShieldCheck, Trash2, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";

type FeatureStatus = "enabled" | "disabled" | "beta" | "dev";
type FeatureType = "core" | "optional" | "experimental";
type Permission = "manage" | "read" | null;
interface RolePermission { roleName: string; permission: Permission }
interface AppFeature { id: string; name: string; description: string; moduleId: string; status: FeatureStatus; type: FeatureType; rolePermissions: RolePermission[] }

const availableModules = [
  { id: "m1", name: "Auth" }, { id: "m2", name: "Patient Management" }, { id: "m3", name: "Appointments" },
  { id: "m4", name: "Prescriptions" }, { id: "m5", name: "Billing & POS" }, { id: "m6", name: "Medicine Catalog" },
  { id: "m7", name: "Queue Management" }, { id: "m8", name: "Dispensing" },
];
const allRoles = [{ name: "Admin", color: "default" as const }, { name: "Doctor", color: "secondary" as const }, { name: "Nurse", color: "outline" as const }, { name: "Receptionist", color: "outline" as const }, { name: "Pharmacist", color: "secondary" as const }];

const typeClass: Record<FeatureType, string> = { core: "bg-primary/10 text-primary", optional: "bg-muted text-muted-foreground", experimental: "bg-amber-600/10 text-amber-600" };

function getModuleName(moduleId: string): string { return availableModules.find((m) => m.id === moduleId)?.name ?? moduleId; }
function nextPermission(current: Permission): Permission { if (current === null) return "read"; if (current === "read") return "manage"; return null; }

function PermissionBadge({ permission }: { permission: Permission }) {
  if (permission === "manage") return <span className="inline-flex items-center gap-1 rounded-none bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"><Check className="size-3" />Manage</span>;
  if (permission === "read") return <span className="inline-flex items-center gap-1 rounded-none bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"><Check className="size-3" />Read</span>;
  return <span className="inline-flex items-center gap-1 rounded-none bg-transparent px-2 py-0.5 text-xs text-muted-foreground/50"><Minus className="size-3" />None</span>;
}

const initialFeatures: AppFeature[] = [
  { id: "f1", name: "JWT Login", description: "Email/password authentication with JWT access and refresh tokens", moduleId: "m1", status: "enabled", type: "core", rolePermissions: allRoles.map((r) => ({ roleName: r.name, permission: r.name === "Admin" ? "manage" : "read" as Permission })) },
  { id: "f2", name: "OTP Login", description: "One-time password authentication via email for quick access", moduleId: "m1", status: "enabled", type: "core", rolePermissions: allRoles.map((r) => ({ roleName: r.name, permission: "read" as Permission })) },
  { id: "f3", name: "Google Auth Login", description: "OAuth 2.0 authentication via Google provider", moduleId: "m1", status: "disabled", type: "optional", rolePermissions: allRoles.map((r) => ({ roleName: r.name, permission: r.name === "Admin" ? "manage" : null as Permission })) },
  { id: "f4", name: "Walk-in Appointment", description: "Allow patients to book walk-in appointments at the front desk", moduleId: "m3", status: "enabled", type: "core", rolePermissions: [{ roleName: "Admin", permission: "manage" }, { roleName: "Doctor", permission: "read" }, { roleName: "Nurse", permission: "read" }, { roleName: "Receptionist", permission: "manage" }, { roleName: "Pharmacist", permission: null }] },
  { id: "f5", name: "Token Queue System", description: "Real-time token queue with status tracking per doctor", moduleId: "m7", status: "enabled", type: "core", rolePermissions: [{ roleName: "Admin", permission: "manage" }, { roleName: "Doctor", permission: "read" }, { roleName: "Nurse", permission: "read" }, { roleName: "Receptionist", permission: "manage" }, { roleName: "Pharmacist", permission: null }] },
  { id: "f6", name: "E-Prescription", description: "Digital prescription generation with medicine autocomplete", moduleId: "m4", status: "enabled", type: "core", rolePermissions: [{ roleName: "Admin", permission: "manage" }, { roleName: "Doctor", permission: "manage" }, { roleName: "Nurse", permission: "read" }, { roleName: "Receptionist", permission: null }, { roleName: "Pharmacist", permission: "read" }] },
  { id: "f7", name: "SMS Notifications", description: "Send appointment reminders and status updates via SMS", moduleId: "m2", status: "disabled", type: "optional", rolePermissions: allRoles.map((r) => ({ roleName: r.name, permission: "manage" as Permission })) },
  { id: "f8", name: "Partial Dispensing", description: "Allow partial fulfillment of prescriptions with balance tracking", moduleId: "m8", status: "beta", type: "experimental", rolePermissions: [{ roleName: "Admin", permission: "manage" }, { roleName: "Doctor", permission: null }, { roleName: "Nurse", permission: null }, { roleName: "Receptionist", permission: null }, { roleName: "Pharmacist", permission: "manage" }] },
];

export function DevelopmentFeaturesPage() {
  const [features, setFeatures] = useState<AppFeature[]>(initialFeatures);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<AppFeature | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formName, setFormName] = useState(""); const [formDesc, setFormDesc] = useState(""); const [formModule, setFormModule] = useState("m1");
  const [formStatus, setFormStatus] = useState<FeatureStatus>("disabled"); const [formType, setFormType] = useState<FeatureType>("optional");
  const [formRoles, setFormRoles] = useState<RolePermission[]>([]);

  const filtered = features.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()) || f.description.toLowerCase().includes(search.toLowerCase()) || getModuleName(f.moduleId).toLowerCase().includes(search.toLowerCase()));

  function openAdd() { setEditingFeature(null); setFormName(""); setFormDesc(""); setFormModule("m1"); setFormStatus("disabled"); setFormType("optional"); setFormRoles([...allRoles.map((r) => ({ roleName: r.name, permission: null as Permission }))]); setSheetOpen(true); }
  function openEdit(feature: AppFeature) { setEditingFeature(feature); setFormName(feature.name); setFormDesc(feature.description); setFormModule(feature.moduleId); setFormStatus(feature.status); setFormType(feature.type); setFormRoles(allRoles.map((r) => ({ roleName: r.name, permission: feature.rolePermissions.find((rp) => rp.roleName === r.name)?.permission ?? null }))); setSheetOpen(true); }

  function toggleFormRolePermission(roleName: string) { setFormRoles((prev) => prev.map((rp) => rp.roleName === roleName ? { ...rp, permission: nextPermission(rp.permission) } : rp)); }
  function cycleFeaturePermission(featureId: string, roleName: string) { setFeatures((prev) => prev.map((f) => f.id === featureId ? { ...f, rolePermissions: f.rolePermissions.map((rp) => rp.roleName === roleName ? { ...rp, permission: nextPermission(rp.permission) } : rp) } : f)); }

  function handleSave() {
    if (!formName.trim()) return;
    if (editingFeature) setFeatures((prev) => prev.map((f) => f.id === editingFeature.id ? { ...f, name: formName.trim(), description: formDesc.trim(), moduleId: formModule, status: formStatus, type: formType, rolePermissions: formRoles } : f));
    else setFeatures((prev) => [...prev, { id: `f${Date.now()}`, name: formName.trim(), description: formDesc.trim(), moduleId: formModule, status: formStatus, type: formType, rolePermissions: formRoles }]);
    setSheetOpen(false); setEditingFeature(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight">Application Features</h1><p className="mt-1 text-sm text-muted-foreground">Manage features and configure role-based access per feature</p></div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild><Button><Plus className="mr-2 size-4" />Add Feature</Button></SheetTrigger>
          <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
            <SheetHeader><SheetTitle>{editingFeature ? "Edit Feature" : "Add Feature"}</SheetTitle><SheetDescription>{editingFeature ? "Update the feature details and role permissions." : "Register a new feature under a module."}</SheetDescription></SheetHeader>
            <div className="flex-1 space-y-4 px-4 pb-4">
              <FieldGroup>
                <Field><FieldLabel htmlFor="feat-name">Feature Name</FieldLabel><Input id="feat-name" placeholder="e.g. JWT Login" value={formName} onChange={(e) => setFormName(e.target.value)} /></Field>
                <Field><FieldLabel htmlFor="feat-desc">Description</FieldLabel><Input id="feat-desc" placeholder="What does this feature do?" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} /></Field>
                <Field><FieldLabel htmlFor="feat-module">Module</FieldLabel>
                  <select id="feat-module" className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm" value={formModule} onChange={(e) => setFormModule(e.target.value)}>
                    {availableModules.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
                  </select>
                </Field>
                <div className="flex gap-3">
                  <Field className="flex-1"><FieldLabel htmlFor="feat-status">Status</FieldLabel>
                    <select id="feat-status" className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm" value={formStatus} onChange={(e) => setFormStatus(e.target.value as FeatureStatus)}>
                      <option value="enabled">Enabled</option><option value="disabled">Disabled</option><option value="beta">Beta</option><option value="dev">Dev</option>
                    </select>
                  </Field>
                  <Field className="flex-1"><FieldLabel htmlFor="feat-type">Type</FieldLabel>
                    <select id="feat-type" className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm" value={formType} onChange={(e) => setFormType(e.target.value as FeatureType)}>
                      <option value="core">Core</option><option value="optional">Optional</option><option value="experimental">Experimental</option>
                    </select>
                  </Field>
                </div>
              </FieldGroup>
              <div><h3 className="mb-3 text-sm font-medium">Role &amp; Permission Setup</h3><p className="mb-3 text-xs text-muted-foreground">Click each role to cycle permissions: None → Read → Manage</p>
                <div className="space-y-2">{formRoles.map((rp) => (<button key={rp.roleName} type="button" onClick={() => toggleFormRolePermission(rp.roleName)} className="flex w-full items-center justify-between rounded-none border p-3 text-left text-sm transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-muted-foreground" /><span className="font-medium">{rp.roleName}</span></div><PermissionBadge permission={rp.permission} />
                </button>))}</div>
              </div>
            </div>
            <SheetFooter><Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={!formName.trim()}>{editingFeature ? "Save Changes" : "Create Feature"}</Button></SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <Card><CardHeader className="pb-3"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search features by name, description, or module..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div></CardHeader>
        <CardContent className="p-0">{filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center"><Zap className="size-8 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">No features found</p></div>
        ) : (
          <div className="divide-y">{filtered.map((feature) => {
            const isExpanded = expandedId === feature.id;
            return (<div key={feature.id}>
              <div className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50">
                <button type="button" onClick={() => setExpandedId(isExpanded ? null : feature.id)} className="flex size-6 shrink-0 items-center justify-center rounded hover:bg-muted">
                  {isExpanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                </button>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-none bg-primary/10"><Zap className="size-4 text-primary" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><p className="text-sm font-medium">{feature.name}</p><Badge variant="secondary" className="text-[10px]">{getModuleName(feature.moduleId)}</Badge><Badge variant="outline" className={typeClass[feature.type]}>{feature.type}</Badge></div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{feature.description}</p>
                </div>
                <div className="flex items-center gap-2"><Badge variant={feature.status === "enabled" ? "default" : feature.status === "beta" ? "secondary" : "outline"} className={feature.status === "enabled" ? "bg-green-600/10 text-green-600" : feature.status === "beta" ? "bg-amber-600/10 text-amber-600" : ""}>{feature.status}</Badge></div>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(feature)}><Pencil className="size-3.5" /></Button>
                  {deleteConfirm === feature.id ? (
                    <div className="flex items-center gap-1"><Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => { setFeatures((prev) => prev.filter((f) => f.id !== feature.id)); setDeleteConfirm(null); }}>Confirm</Button><Button variant="ghost" size="icon" className="size-8" onClick={() => setDeleteConfirm(null)}><X className="size-3.5" /></Button></div>
                  ) : (<Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(feature.id)}><Trash2 className="size-3.5" /></Button>)}
                </div>
              </div>
              {isExpanded && (
                <div className="border-t bg-muted/30 px-6 py-4">
                  <div className="flex items-center justify-between"><h4 className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="size-4 text-muted-foreground" />Role &amp; Permission Access</h4><p className="text-xs text-muted-foreground">Click to cycle: None → Read → Manage</p></div>
                  <Separator className="my-3" />
                  <div className="flex flex-wrap gap-2">{allRoles.map((role) => {
                    const rp = feature.rolePermissions.find((r) => r.roleName === role.name);
                    return (<button key={role.name} type="button" onClick={() => cycleFeaturePermission(feature.id, role.name)} className="flex items-center gap-2 rounded-none border bg-background px-3 py-2 text-sm transition-colors hover:bg-muted">
                      <ShieldCheck className="size-3.5 text-muted-foreground" /><span className="font-medium">{role.name}</span><PermissionBadge permission={rp?.permission ?? null} />
                    </button>);
                  })}</div>
                </div>
              )}
            </div>);
          })}</div>
        )}</CardContent>
      </Card>
    </div>
  );
}
