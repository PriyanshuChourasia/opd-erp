import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Plus, ShieldCheck, Trash2, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { fetchRoles, fetchRole, createRole, updateRole, deleteRole, fetchPermissions, createPermission, deletePermission, type Role, type Permission } from "@/lib/api";
import { resourceLabels, defaultResources, defaultActions } from "../data/interface";

function PermissionIcon({ value }: { value: string | null | undefined }) {
  if (value === "manage") return <span className="inline-flex items-center gap-1 text-xs font-medium text-primary"><Check className="size-3.5" />Manage</span>;
  if (value === "read") return <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"><Check className="size-3.5" />Read</span>;
  return <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/50"><X className="size-3.5" />None</span>;
}

export function RolesPage() {
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [permSheetOpen, setPermSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formName, setFormName] = useState(""); const [formDesc, setFormDesc] = useState(""); const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [permResource, setPermResource] = useState(""); const [permAction, setPermAction] = useState(""); const [permName, setPermName] = useState("");

  const { data: roles = [], isLoading } = useQuery({ queryKey: ["roles"], queryFn: fetchRoles });
  const { data: allPermissions = [] } = useQuery({ queryKey: ["permissions"], queryFn: fetchPermissions });

  const seedPermissionsMutation = useMutation({
    mutationFn: async () => {
      const existing = (await queryClient.fetchQuery({ queryKey: ["permissions"], queryFn: fetchPermissions })) ?? [];
      if (existing.length > 0) return existing;
      const created: Permission[] = [];
      for (const resource of defaultResources) {
        for (const action of defaultActions) {
          created.push(await createPermission({ resource, action, name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}` }));
        }
      }
      return created;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["permissions"] }),
  });

  const createMutation = useMutation({ mutationFn: createRole, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["roles"] }); closeSheet(); } });
  const updateMutation = useMutation({ mutationFn: ({ id, data }: { id: string; data: { name: string; description?: string; permissionIds?: string[] } }) => updateRole(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["roles"] }); closeSheet(); } });
  const deleteMutation = useMutation({ mutationFn: deleteRole, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["roles"] }); setDeleteConfirm(null); } });
  const deletePermMutation = useMutation({ mutationFn: deletePermission, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["permissions"] }) });

  function openAdd() { setEditingId(null); setFormName(""); setFormDesc(""); setFormPermissions([]); setSheetOpen(true); }
  async function openEdit(id: string) { setEditingId(id); const role = await queryClient.fetchQuery({ queryKey: ["role", id], queryFn: () => fetchRole(id) }); setFormName(role.name); setFormDesc(role.description ?? ""); setFormPermissions(role.rolePermissions.map((rp: any) => rp.permissionId)); setSheetOpen(true); }
  function closeSheet() { setSheetOpen(false); setEditingId(null); }
  function togglePermission(permissionId: string) { setFormPermissions((prev) => prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId]); }
  function handleSave() { if (!formName.trim()) return; const data = { name: formName.trim(), description: formDesc.trim() || undefined, permissionIds: formPermissions.length > 0 ? formPermissions : undefined }; if (editingId) updateMutation.mutate({ id: editingId, data }); else createMutation.mutate(data as any); }

  const groupedPermissions: Record<string, Permission[]> = {};
  for (const perm of allPermissions) { const key = perm.resource; if (!groupedPermissions[key]) groupedPermissions[key] = []; groupedPermissions[key]!.push(perm); }

  function getEffectivePermission(role: Role, resource: string): "manage" | "read" | null {
    const perms = role.rolePermissions.filter((rp: any) => rp.permission.resource === resource).map((rp: any) => rp.permission.action);
    if (perms.includes("manage")) return "manage";
    if (perms.includes("read") || perms.includes("create") || perms.includes("update") || perms.includes("delete")) return "read";
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight">Roles & Permissions</h1><p className="mt-1 text-sm text-muted-foreground">Define roles and control access to system features</p></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => seedPermissionsMutation.mutate()} disabled={seedPermissionsMutation.isPending}>Seed Permissions</Button>
          <Sheet open={permSheetOpen} onOpenChange={setPermSheetOpen}>
            <SheetTrigger asChild><Button variant="outline" onClick={() => { setPermResource(""); setPermAction(""); setPermName(""); setPermSheetOpen(true); }}><Plus className="mr-2 size-4" />New Permission</Button></SheetTrigger>
            <SheetContent side="right" className="sm:max-w-md">
              <SheetHeader><SheetTitle>Create Permission</SheetTitle><SheetDescription>Add a new permission rule.</SheetDescription></SheetHeader>
              <div className="flex-1 space-y-4 px-4 pb-4"><FieldGroup>
                <Field><FieldLabel htmlFor="perm-resource">Resource</FieldLabel><Input id="perm-resource" placeholder="e.g. patients, billing" value={permResource} onChange={(e) => setPermResource(e.target.value)} /></Field>
                <Field><FieldLabel htmlFor="perm-action">Action</FieldLabel><select id="perm-action" className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm" value={permAction} onChange={(e) => setPermAction(e.target.value)}><option value="">Select...</option><option value="read">Read</option><option value="create">Create</option><option value="update">Update</option><option value="delete">Delete</option><option value="manage">Manage</option></select></Field>
                <Field><FieldLabel htmlFor="perm-name">Display Name</FieldLabel><Input id="perm-name" placeholder="e.g. Read Patients" value={permName} onChange={(e) => setPermName(e.target.value)} /></Field>
              </FieldGroup></div>
              <SheetFooter><Button variant="outline" onClick={() => setPermSheetOpen(false)}>Cancel</Button><Button onClick={async () => { await createPermission({ resource: permResource, action: permAction, name: permName }); queryClient.invalidateQueries({ queryKey: ["permissions"] }); setPermSheetOpen(false); }} disabled={!permResource || !permAction || !permName}>Create</Button></SheetFooter>
            </SheetContent>
          </Sheet>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild><Button onClick={openAdd}><Plus className="mr-2 size-4" />Create Role</Button></SheetTrigger>
            <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
              <SheetHeader><SheetTitle>{editingId ? "Edit Role" : "Create Role"}</SheetTitle><SheetDescription>{editingId ? "Update the role and its permissions." : "Define a new role and assign permissions."}</SheetDescription></SheetHeader>
              <div className="flex-1 space-y-4 px-4 pb-4"><FieldGroup>
                <Field><FieldLabel htmlFor="r-name">Role Name *</FieldLabel><Input id="r-name" placeholder="e.g. Manager" value={formName} onChange={(e) => setFormName(e.target.value)} /></Field>
                <Field><FieldLabel htmlFor="r-desc">Description</FieldLabel><Input id="r-desc" placeholder="What this role can do" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} /></Field>
              </FieldGroup>
              <div><h3 className="mb-2 text-sm font-medium">Permissions</h3><p className="mb-3 text-xs text-muted-foreground">Select the permissions assigned to this role.</p>
                {allPermissions.length === 0 ? (<p className="text-sm text-muted-foreground">No permissions defined. Click "Seed Permissions" first.</p>) : (
                  <div className="space-y-3">{Object.entries(groupedPermissions).map(([resource, perms]) => (
                    <div key={resource}><p className="mb-1 text-xs font-medium text-muted-foreground uppercase">{resourceLabels[resource] ?? resource}</p>
                      <div className="flex flex-wrap gap-1.5">{perms.map((perm) => {
                        const selected = formPermissions.includes(perm.id);
                        return (<button key={perm.id} type="button" onClick={() => togglePermission(perm.id)}
                          className={`inline-flex items-center gap-1 rounded-none border px-2 py-1 text-xs font-medium transition-colors ${selected ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground hover:bg-muted"}`}>
                          {selected && <Check className="size-3" />}{perm.action}
                        </button>);
                      })}</div>
                    </div>
                  ))}</div>
                )}
              </div></div>
              <SheetFooter><Button variant="outline" onClick={closeSheet}>Cancel</Button><Button onClick={handleSave} disabled={!formName.trim() || createMutation.isPending || updateMutation.isPending}>{editingId ? "Save Changes" : "Create Role"}</Button></SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {isLoading ? (<div className="flex justify-center py-12"><span className="text-sm text-muted-foreground">Loading...</span></div>) : (<>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {roles.map((role) => (
            <Card key={role.id} className="group relative flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-muted-foreground" /><CardTitle className="text-sm">{role.name}</CardTitle></div>
                  <div className="flex items-center gap-1">{role._count && <Badge variant="secondary" className="text-[10px]"><Users className="mr-1 size-2.5" />{role._count.users}</Badge>}{role.isSystem && <Badge variant="outline" className="text-[10px]">System</Badge>}</div>
                </div>
                <CardDescription className="text-xs">{role.description ?? "No description"}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-1.5 pt-0">
                <Separator className="mb-1" />
                {Object.keys(resourceLabels).slice(0, 4).map((resource) => (
                  <div key={resource} className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{resourceLabels[resource]}</span><PermissionIcon value={getEffectivePermission(role, resource)} /></div>
                ))}
                {Object.keys(resourceLabels).length > 4 && <p className="text-xs text-muted-foreground">+{Object.keys(resourceLabels).length - 4} more resources</p>}
              </CardContent>
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(role.id)}><Pencil className="size-3" /></Button>
                {!role.isSystem && (deleteConfirm === role.id ? (
                  <div className="flex items-center gap-1"><Button variant="destructive" size="sm" className="h-7 text-[10px] px-2" onClick={() => deleteMutation.mutate(role.id)}>Confirm</Button><Button variant="ghost" size="icon" className="size-7" onClick={() => setDeleteConfirm(null)}><X className="size-3" /></Button></div>
                ) : (<Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => setDeleteConfirm(role.id)}><Trash2 className="size-3" /></Button>))}
              </div>
            </Card>
          ))}
        </div>

        <Card><CardHeader><CardTitle className="text-base">Permission Matrix</CardTitle><CardDescription>Granular access control for each role across all resources</CardDescription></CardHeader>
          <CardContent className="overflow-x-auto p-0"><Table><TableHeader><TableRow><TableHead className="sticky left-0 bg-background min-w-[140px]">Resource</TableHead>{roles.map((role) => (<TableHead key={role.id} className="text-center min-w-[100px]">{role.name}</TableHead>))}</TableRow></TableHeader>
            <TableBody>{Object.keys(resourceLabels).map((resource) => (<TableRow key={resource}>
              <TableCell className="sticky left-0 bg-background font-medium">{resourceLabels[resource]}</TableCell>
              {roles.map((role) => (<TableCell key={role.id} className="text-center"><PermissionIcon value={getEffectivePermission(role, resource)} /></TableCell>))}
            </TableRow>))}</TableBody></Table></CardContent>
        </Card>

        <Card><CardHeader><CardTitle className="text-base">All Permissions</CardTitle><CardDescription>Available permission rules in the system</CardDescription></CardHeader>
          <CardContent className="p-0">{allPermissions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center"><ShieldCheck className="size-8 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">No permissions yet — click "Seed Permissions" to create defaults</p></div>
          ) : (
            <div className="divide-y">{allPermissions.map((perm) => (
              <div key={perm.id} className="group flex items-center justify-between px-6 py-3 text-sm hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3"><ShieldCheck className="size-4 text-muted-foreground" /><span className="font-medium">{perm.name}</span><Badge variant="outline" className="text-[10px]">{perm.resource}</Badge><Badge variant="secondary" className="text-[10px]">{perm.action}</Badge></div>
                <Button variant="ghost" size="icon" className="size-7 text-destructive opacity-0 transition-opacity group-hover:opacity-100" onClick={() => deletePermMutation.mutate(perm.id)}><Trash2 className="size-3" /></Button>
              </div>
            ))}</div>
          )}</CardContent>
        </Card>
      </>)}
    </div>
  );
}
