import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Check, Pencil, Plus, ShieldCheck, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { DataTable } from "@/components/data-table/data-table";
import { fetchRoles, fetchRole, createRole, updateRole, deleteRole, fetchPermissions, createPermission, deletePermission, type Role, type Permission } from "@/lib/api";
import { resourceLabels, defaultResources, defaultActions } from "../data/interface";

// Large-enough limit to cover "give me every role/permission" use cases
// (the permission matrix, and the permission-picker inside the role sheet)
// without pagination — there are only ever a handful of roles/permissions.
const ALL_LIMIT = 100;

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
  const [deletePermConfirm, setDeletePermConfirm] = useState<string | null>(null);
  const [formName, setFormName] = useState(""); const [formDesc, setFormDesc] = useState(""); const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [permResource, setPermResource] = useState(""); const [permAction, setPermAction] = useState(""); const [permName, setPermName] = useState("");

  const [rolesPagination, setRolesPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [permsPagination, setPermsPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });

  // Paginated lists that back the two tables.
  const { data: rolesResponse, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", rolesPagination.pageIndex, rolesPagination.pageSize],
    queryFn: () => fetchRoles({ page: rolesPagination.pageIndex + 1, limit: rolesPagination.pageSize }),
    placeholderData: (previous) => previous,
  });
  const { data: permissionsResponse, isLoading: permissionsLoading } = useQuery({
    queryKey: ["permissions", permsPagination.pageIndex, permsPagination.pageSize],
    queryFn: () => fetchPermissions({ page: permsPagination.pageIndex + 1, limit: permsPagination.pageSize }),
    placeholderData: (previous) => previous,
  });

  const roles = rolesResponse?.data ?? [];
  const rolesPageCount = rolesResponse?.meta?.totalPages ?? 0;
  const permissionsList = permissionsResponse?.data ?? [];
  const permissionsPageCount = permissionsResponse?.meta?.totalPages ?? 0;

  // Unpaginated lists (few enough records to always fetch in full) for the
  // permission matrix and the permission-picker inside the role sheet.
  const { data: allRolesResponse } = useQuery({
    queryKey: ["roles", "all"],
    queryFn: () => fetchRoles({ limit: ALL_LIMIT }),
  });
  const { data: allPermissionsResponse } = useQuery({
    queryKey: ["permissions", "all"],
    queryFn: () => fetchPermissions({ limit: ALL_LIMIT }),
  });
  const allRoles = allRolesResponse?.data ?? [];
  const allPermissions = allPermissionsResponse?.data ?? [];

  const seedPermissionsMutation = useMutation({
    mutationFn: async () => {
      const existing = await queryClient.fetchQuery({ queryKey: ["permissions", "all"], queryFn: () => fetchPermissions({ limit: ALL_LIMIT }) });
      if (existing.data.length > 0) return existing.data;
      const created: Permission[] = [];
      for (const resource of defaultResources) {
        for (const action of defaultActions) {
          created.push(await createPermission({ resource, action, name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}` }));
        }
      }
      return created;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["permissions"] }); toast.success("Default permissions seeded"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  const createMutation = useMutation({ mutationFn: createRole, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["roles"] }); closeSheet(); toast.success("Role created successfully"); }, onError: (err) => { toast.error(extractApiError(err)); } });
  const updateMutation = useMutation({ mutationFn: ({ id, data }: { id: string; data: { name: string; description?: string; permissionIds?: string[] } }) => updateRole(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["roles"] }); closeSheet(); toast.success("Role updated successfully"); }, onError: (err) => { toast.error(extractApiError(err)); } });
  const deleteMutation = useMutation({ mutationFn: deleteRole, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["roles"] }); setDeleteConfirm(null); toast.success("Role deleted successfully"); }, onError: (err) => { toast.error(extractApiError(err)); } });
  const deletePermMutation = useMutation({ mutationFn: deletePermission, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["permissions"] }); setDeletePermConfirm(null); toast.success("Permission deleted"); }, onError: (err) => { toast.error(extractApiError(err)); } });

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

  const roleColumns = useMemo<ColumnDef<Role>[]>(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-muted-foreground" />
            <span className="font-medium">{role.name}</span>
            {role.isSystem && <Badge variant="outline" className="text-[10px]">System</Badge>}
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => row.original.description ?? <span className="text-muted-foreground">No description</span>,
    },
    {
      id: "permissionCount",
      header: "Permissions",
      cell: ({ row }) => <Badge variant="secondary" className="text-[10px]">{row.original.rolePermissions.length}</Badge>,
    },
    {
      id: "userCount",
      header: "Users",
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-[10px]">
          <Users className="mr-1 size-2.5" />{row.original._count?.users ?? 0}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(role.id)}>
              <Pencil className="size-3.5" />
            </Button>
            {!role.isSystem && (deleteConfirm === role.id ? (
              <div className="flex items-center gap-1">
                <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => deleteMutation.mutate(role.id)}>Confirm</Button>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => setDeleteConfirm(null)}><X className="size-3.5" /></Button>
              </div>
            ) : (
              <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(role.id)}>
                <Trash2 className="size-3.5" />
              </Button>
            ))}
          </div>
        );
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [deleteConfirm]);

  const permissionColumns = useMemo<ColumnDef<Permission>[]>(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-muted-foreground" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "resource",
      header: "Resource",
      cell: ({ row }) => <Badge variant="outline" className="text-[10px]">{row.original.resource}</Badge>,
    },
    {
      accessorKey: "action",
      header: "Description",
      cell: ({ row }) => <Badge variant="secondary" className="text-[10px]">{row.original.action}</Badge>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const perm = row.original;
        return (
          <div className="flex justify-end gap-1">
            {deletePermConfirm === perm.id ? (
              <div className="flex items-center gap-1">
                <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => deletePermMutation.mutate(perm.id)}>Confirm</Button>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => setDeletePermConfirm(null)}><X className="size-3.5" /></Button>
              </div>
            ) : (
              <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => setDeletePermConfirm(perm.id)}>
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        );
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [deletePermConfirm]);

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
              <SheetFooter><Button variant="outline" onClick={() => setPermSheetOpen(false)}>Cancel</Button><Button onClick={async () => { await createPermission({ resource: permResource, action: permAction, name: permName }); queryClient.invalidateQueries({ queryKey: ["permissions"] }); setPermSheetOpen(false); toast.success("Permission created"); }} disabled={!permResource || !permAction || !permName}>Create</Button></SheetFooter>
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

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Roles</CardTitle><CardDescription>All roles defined in the system</CardDescription></CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={roleColumns}
            data={roles}
            pageCount={rolesPageCount}
            pagination={rolesPagination}
            onPaginationChange={setRolesPagination}
            isLoading={rolesLoading}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <ShieldCheck className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No roles created yet</p>
              </div>
            }
          />
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle className="text-base">Permission Matrix</CardTitle><CardDescription>Granular access control for each role across all resources</CardDescription></CardHeader>
        <CardContent className="overflow-x-auto p-0"><Table><TableHeader><TableRow><TableHead className="sticky left-0 bg-background min-w-[140px]">Resource</TableHead>{allRoles.map((role) => (<TableHead key={role.id} className="text-center min-w-[100px]">{role.name}</TableHead>))}</TableRow></TableHeader>
          <TableBody>{Object.keys(resourceLabels).map((resource) => (<TableRow key={resource}>
            <TableCell className="sticky left-0 bg-background font-medium">{resourceLabels[resource]}</TableCell>
            {allRoles.map((role) => (<TableCell key={role.id} className="text-center"><PermissionIcon value={getEffectivePermission(role, resource)} /></TableCell>))}
          </TableRow>))}</TableBody></Table></CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">All Permissions</CardTitle><CardDescription>Available permission rules in the system</CardDescription></CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={permissionColumns}
            data={permissionsList}
            pageCount={permissionsPageCount}
            pagination={permsPagination}
            onPaginationChange={setPermsPagination}
            isLoading={permissionsLoading}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <ShieldCheck className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No permissions yet — click "Seed Permissions" to create defaults</p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
