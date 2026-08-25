import { Fragment, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  fetchRoles,
  fetchRole,
  createRole,
  updateRole,
  deleteRole,
  fetchPermissions,
  createPermission,
  deletePermission,
  type Role,
  type Permission,
} from "@/lib/api";
import {
  resourceLabels,
  resourceCategories,
  defaultResources,
  defaultActions,
  roleColors,
} from "../data/interface";

const ALL_LIMIT = 500;

function PermissionIcon({
  value,
}: {
  value: "manage" | "read" | null;
}) {
  if (value === "manage")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
        <Check className="size-3.5" /> Manage
      </span>
    );
  if (value === "read")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Check className="size-3.5" /> Read
      </span>
    );
  return (
    <span className="text-xs text-muted-foreground/50">
      <X className="size-3.5" /> None
    </span>
  );
}

export function RolesPage() {
  const queryClient = useQueryClient();

  // Role state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPermissions, setFormPermissions] = useState<string[]>([]);

  // Permission state
  const [permSheetOpen, setPermSheetOpen] = useState(false);
  const [permResource, setPermResource] = useState("");
  const [permAction, setPermAction] = useState("");
  const [permName, setPermName] = useState("");
  const [permSearch, setPermSearch] = useState("");
  const [permModuleFilter, setPermModuleFilter] = useState("");
  const [permActionFilter, setPermActionFilter] = useState("");
  const [deletePermConfirm, setDeletePermConfirm] = useState<string | null>(
    null,
  );

  // ─── Queries ────────────────────────────────────────────────

  const { data: rolesResponse, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => fetchRoles({ limit: 100 }),
  });

  const { data: permissionsResponse, isLoading: permissionsLoading } = useQuery(
    {
      queryKey: ["permissions"],
      queryFn: () => fetchPermissions({ limit: ALL_LIMIT }),
    },
  );

  const roles = rolesResponse?.data ?? [];
  const allPermissions = permissionsResponse?.data ?? [];

  // ─── Filtered permissions list ──────────────────────────────

  const filteredPermissions = useMemo(() => {
    let list = allPermissions;
    if (permModuleFilter) list = list.filter((p) => p.resource === permModuleFilter);
    if (permActionFilter) list = list.filter((p) => p.action === permActionFilter);
    if (permSearch.trim()) {
      const q = permSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.resource.toLowerCase().includes(q) ||
          p.action.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allPermissions, permSearch, permModuleFilter, permActionFilter]);

  const uniqueModules = useMemo(
    () => [...new Set(allPermissions.map((p) => p.resource))].sort(),
    [allPermissions],
  );
  const uniqueActions = useMemo(
    () => [...new Set(allPermissions.map((p) => p.action))].sort(),
    [allPermissions],
  );

  // ─── Mutations ──────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      closeSheet();
      toast.success("Role created successfully");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name: string; description?: string; permissionIds?: string[] };
    }) => updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      closeSheet();
      toast.success("Role updated successfully");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setDeleteConfirm(null);
      toast.success("Role deleted successfully");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const deletePermMutation = useMutation({
    mutationFn: deletePermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      setDeletePermConfirm(null);
      toast.success("Permission deleted");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  // ─── Handlers ───────────────────────────────────────────────

  function openAdd() {
    setEditingId(null);
    setFormName("");
    setFormDesc("");
    setFormPermissions([]);
    setSheetOpen(true);
  }

  async function openEdit(id: string) {
    setEditingId(id);
    try {
      const role = await queryClient.fetchQuery({
        queryKey: ["role", id],
        queryFn: () => fetchRole(id),
      });
      setFormName(role.name);
      setFormDesc(role.description ?? "");
      setFormPermissions(
        role.rolePermissions.map((rp) => rp.permissionId),
      );
    } catch {
      toast.error("Failed to load role details");
      return;
    }
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditingId(null);
  }

  function togglePermission(permissionId: string) {
    setFormPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId],
    );
  }

  function handleSave() {
    if (!formName.trim()) return;
    const data = {
      name: formName.trim(),
      description: formDesc.trim() || undefined,
      permissionIds:
        formPermissions.length > 0 ? formPermissions : undefined,
    };
    if (editingId) updateMutation.mutate({ id: editingId, data });
    else createMutation.mutate(data);
  }

  // ─── Grouped permissions for matrix ─────────────────────────

  const groupedPermissions: Record<string, Permission[]> = {};
  for (const perm of allPermissions) {
    const key = perm.resource;
    if (!groupedPermissions[key]) groupedPermissions[key] = [];
    groupedPermissions[key]!.push(perm);
  }

  function getEffectivePermission(
    role: Role,
    resource: string,
  ): "manage" | "read" | null {
    const perms = role.rolePermissions
      .filter((rp) => rp.permission.resource === resource)
      .map((rp) => rp.permission.action);
    if (perms.includes("manage")) return "manage";
    if (
      perms.includes("read") ||
      perms.includes("create") ||
      perms.includes("update") ||
      perms.includes("delete")
    )
      return "read";
    return null;
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Roles & Permissions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define roles and control access to system features
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* New Permission Sheet */}
          <Sheet open={permSheetOpen} onOpenChange={setPermSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                onClick={() => {
                  setPermResource("");
                  setPermAction("");
                  setPermName("");
                  setPermSheetOpen(true);
                }}
              >
                <Plus className="mr-2 size-4" />
                New Permission
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Create Permission</SheetTitle>
                <SheetDescription>
                  Add a new permission rule.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 space-y-4 px-4 pb-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="perm-resource">Resource</FieldLabel>
                    <Input
                      id="perm-resource"
                      placeholder="e.g. users, modules"
                      value={permResource}
                      onChange={(e) => setPermResource(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="perm-action">Action</FieldLabel>
                    <select
                      id="perm-action"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      value={permAction}
                      onChange={(e) => setPermAction(e.target.value)}
                    >
                      <option value="">Select...</option>
                      {defaultActions.map((a) => (
                        <option key={a} value={a}>
                          {a.charAt(0).toUpperCase() + a.slice(1)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="perm-name">Display Name</FieldLabel>
                    <Input
                      id="perm-name"
                      placeholder="e.g. Read Users"
                      value={permName}
                      onChange={(e) => setPermName(e.target.value)}
                    />
                  </Field>
                </FieldGroup>
              </div>
              <SheetFooter>
                <Button
                  variant="outline"
                  onClick={() => setPermSheetOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    await createPermission({
                      resource: permResource,
                      action: permAction,
                      name: permName,
                    });
                    queryClient.invalidateQueries({ queryKey: ["permissions"] });
                    setPermSheetOpen(false);
                    toast.success("Permission created");
                  }}
                  disabled={!permResource || !permAction || !permName}
                >
                  Create
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {/* Create Role Sheet */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button onClick={openAdd}>
                <Plus className="mr-2 size-4" />
                Create Role
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="sm:max-w-md flex flex-col"
            >
              <SheetHeader>
                <SheetTitle>
                  {editingId ? "Edit Role" : "Create Role"}
                </SheetTitle>
                <SheetDescription>
                  {editingId
                    ? "Update the role and its permissions."
                    : "Define a new role and assign permissions."}
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto space-y-4 px-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="r-name">Role Name *</FieldLabel>
                    <Input
                      id="r-name"
                      placeholder="e.g. Manager"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="r-desc">Description</FieldLabel>
                    <Input
                      id="r-desc"
                      placeholder="What this role can do"
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                    />
                  </Field>
                </FieldGroup>

                <div>
                  <h3 className="mb-2 text-sm font-medium">Permissions</h3>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Select the permissions assigned to this role.
                  </p>
                  {allPermissions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No permissions defined. Create some first.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {resourceCategories.map((category) => (
                        <div key={category.label}>
                          <p className="mb-2 text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                            {category.label}
                          </p>
                          <div className="space-y-2">
                            {category.resources
                              .filter((r) => groupedPermissions[r])
                              .map((resource) => {
                                const perms = groupedPermissions[resource]!;
                                return (
                                  <div
                                    key={resource}
                                    className="rounded-lg border p-2"
                                  >
                                    <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
                                      {resourceLabels[resource] ?? resource}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {perms.map((perm) => {
                                        const selected =
                                          formPermissions.includes(perm.id);
                                        return (
                                          <button
                                            key={perm.id}
                                            type="button"
                                            onClick={() =>
                                              togglePermission(perm.id)
                                            }
                                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors ${
                                              selected
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-input text-muted-foreground hover:bg-muted"
                                            }`}
                                          >
                                            {selected && (
                                              <Check className="size-2.5" />
                                            )}
                                            {perm.action}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="px-4 pb-4">
                <SheetFooter>
                  <Button variant="outline" onClick={closeSheet}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={
                      !formName.trim() ||
                      createMutation.isPending ||
                      updateMutation.isPending
                    }
                  >
                    {editingId ? "Save Changes" : "Create Role"}
                  </Button>
                </SheetFooter>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* ─── Roles Table ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Roles</CardTitle>
          <CardDescription>All roles defined in the system</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rolesLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ShieldCheck className="size-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        No roles created yet
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${roleColors[role.name] ?? "bg-muted text-muted-foreground"}`}
                        >
                          <ShieldCheck className="size-3" />
                          {role.name}
                        </span>
                        {role.isSystem && (
                          <Badge variant="outline" className="text-[10px]">
                            System
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {role.description ?? "No description"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {role.rolePermissions.length}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          title="Edit role"
                          onClick={() => openEdit(role.id)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        {!role.isSystem &&
                          (deleteConfirm === role.id ? (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() =>
                                  deleteMutation.mutate(role.id)
                                }
                              >
                                Confirm
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                title="Cancel"
                                onClick={() => setDeleteConfirm(null)}
                              >
                                <X className="size-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:text-destructive"
                              title="Delete role"
                              onClick={() => setDeleteConfirm(role.id)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ─── Permission Matrix ───────────────────────────────── */}
      {roles.length > 0 && allPermissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Permission Matrix</CardTitle>
            <CardDescription>
              Granular access control for each role across all resources
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background min-w-[140px]">
                    Resource
                  </TableHead>
                  {roles.map((role) => (
                    <TableHead key={role.id} className="text-center min-w-[100px]">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${roleColors[role.name] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {role.name}
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {resourceCategories.map((category) => (
                  <Fragment key={category.label}>
                    <TableRow>
                      <TableCell
                        colSpan={roles.length + 1}
                        className="bg-muted/50 font-semibold text-xs uppercase tracking-wider py-1.5"
                      >
                        {category.label}
                      </TableCell>
                    </TableRow>
                    {category.resources.map((resource) => (
                      <TableRow key={resource}>
                        <TableCell className="sticky left-0 bg-background font-medium text-sm">
                          {resourceLabels[resource] ?? resource}
                        </TableCell>
                        {roles.map((role) => (
                          <TableCell key={role.id} className="text-center">
                            <PermissionIcon
                              value={getEffectivePermission(role, resource)}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ─── All Permissions ─────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">All Permissions</CardTitle>
              <CardDescription>
                Available permission rules in the system
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="flex h-8 rounded-md border border-input bg-background px-2 text-xs"
                value={permModuleFilter}
                onChange={(e) => setPermModuleFilter(e.target.value)}
              >
                <option value="">All Resources</option>
                {uniqueModules.map((m) => (
                  <option key={m} value={m}>
                    {resourceLabels[m] ?? m}
                  </option>
                ))}
              </select>
              <select
                className="flex h-8 rounded-md border border-input bg-background px-2 text-xs"
                value={permActionFilter}
                onChange={(e) => setPermActionFilter(e.target.value)}
              >
                <option value="">All Actions</option>
                {uniqueActions.map((f) => (
                  <option key={f} value={f}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </option>
                ))}
              </select>
              <div className="relative w-52">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search permissions..."
                  className="pl-9 h-8"
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissionsLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredPermissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ShieldCheck className="size-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        {permSearch || permModuleFilter || permActionFilter
                          ? "No permissions match your filters"
                          : "No permissions yet — create some first"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPermissions.map((perm) => (
                  <TableRow key={perm.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-muted-foreground" />
                        <span className="font-medium">{perm.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {perm.resource}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {perm.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {deletePermConfirm === perm.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() =>
                                deletePermMutation.mutate(perm.id)
                              }
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              title="Cancel"
                              onClick={() => setDeletePermConfirm(null)}
                            >
                              <X className="size-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            title="Delete permission"
                            onClick={() => setDeletePermConfirm(perm.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
