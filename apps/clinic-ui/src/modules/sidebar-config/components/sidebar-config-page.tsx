import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Check, GripVertical, Pencil, Plus, ShieldCheck, Trash2, X, Eye, EyeOff,
  LayoutDashboard, CalendarClock, Users, UserCog, ClipboardList, Stethoscope,
  BarChart3, AlertCircle, Pill, Receipt, Package, Building2, FileText, Clock,
  MapPin, Cpu, Box, Zap, LifeBuoy, User, Shield, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/data-table/data-table";
import {
  fetchSidebarConfig, createSidebarMenuItem, updateSidebarMenuItem, deleteSidebarMenuItem,
  fetchRoles, type SidebarMenuItem, type Role,
} from "@/lib/api";
import { roleColors } from "@/modules/roles-permissions/data/interface";
import { useAppSelector } from "@/store/hooks";
import { isAdminRole, isDeveloperRole } from "@/lib/roles";

const ALL_LIMIT = 100;

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, CalendarClock, Users, UserCog, ClipboardList, Stethoscope,
  BarChart3, AlertCircle, Pill, Receipt, Package, Building2, FileText, Clock,
  MapPin, Cpu, Box, Zap, LifeBuoy, User, Shield, ShieldCheck,
};

const GROUPS = ["Clinic", "Reports", "Pharmacy & Billing", "Organisation", "Access Control", "Developer", "Account"];

function IconBadge({ name }: { name?: string | null }) {
  if (!name) return null;
  const Icon = ICON_MAP[name];
  return Icon ? <Icon className="size-3.5" /> : null;
}

export function SidebarConfigPage() {
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formLabel, setFormLabel] = useState("");
  const [formPath, setFormPath] = useState("");
  const [formIcon, setFormIcon] = useState("");
  const [formGroup, setFormGroup] = useState("Clinic");
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formIsHidden, setFormIsHidden] = useState(false);
  const [formRoleIds, setFormRoleIds] = useState<string[]>([]);

  // Expanded rows for role assignment
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const user = useAppSelector((state) => state.auth.user);
  const canManage = isDeveloperRole(user?.roleName) || isAdminRole(user?.roleName);

  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ["sidebar-config"],
    queryFn: fetchSidebarConfig,
  });

  const { data: allRolesResponse } = useQuery({
    queryKey: ["roles", "all"],
    queryFn: () => fetchRoles({ limit: ALL_LIMIT }),
  });
  const allRoles = allRolesResponse?.data ?? [];

  const createMutation = useMutation({
    mutationFn: createSidebarMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sidebar-config"] });
      closeSheet();
      toast.success("Menu item created");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateSidebarMenuItem>[1] }) =>
      updateSidebarMenuItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sidebar-config"] });
      closeSheet();
      toast.success("Menu item updated");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSidebarMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sidebar-config"] });
      setDeleteConfirm(null);
      toast.success("Menu item deleted");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const assignRolesMutation = useMutation({
    mutationFn: ({ id, roleIds }: { id: string; roleIds: string[] }) =>
      updateSidebarMenuItem(id, { roleIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sidebar-config"] });
      toast.success("Role assignments updated");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  function openAdd() {
    setEditingId(null);
    setFormLabel(""); setFormPath(""); setFormIcon(""); setFormGroup("Clinic");
    setFormSortOrder(0); setFormIsHidden(false); setFormRoleIds([]);
    setSheetOpen(true);
  }

  function openEdit(item: SidebarMenuItem) {
    setEditingId(item.id);
    setFormLabel(item.label);
    setFormPath(item.path);
    setFormIcon(item.icon ?? "");
    setFormGroup(item.group);
    setFormSortOrder(item.sortOrder);
    setFormIsHidden(item.isHidden);
    setFormRoleIds(item.roleMenus.map((rm) => rm.roleId));
    setSheetOpen(true);
  }

  function closeSheet() { setSheetOpen(false); setEditingId(null); }

  function handleSave() {
    if (!formLabel.trim() || !formPath.trim()) return;
    const data = {
      label: formLabel.trim(),
      path: formPath.trim(),
      icon: formIcon.trim() || undefined,
      group: formGroup,
      sortOrder: formSortOrder,
      isHidden: formIsHidden,
      roleIds: formRoleIds,
    };
    if (editingId) updateMutation.mutate({ id: editingId, data });
    else createMutation.mutate(data);
  }

  function toggleRole(roleId: string) {
    setFormRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  }

  // Group menu items for display
  const grouped = useMemo(() => {
    const groups: Record<string, SidebarMenuItem[]> = {};
    for (const item of menuItems) {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group]!.push(item);
    }
    return groups;
  }, [menuItems]);

  const columns = useMemo<ColumnDef<SidebarMenuItem>[]>(() => [
    {
      id: "drag",
      header: "",
      cell: () => <GripVertical className="size-4 text-muted-foreground/40" />,
      size: 32,
    },
    {
      accessorKey: "label",
      header: "Label",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-2">
            <IconBadge name={item.icon} />
            <span className="font-medium text-sm">{item.label}</span>
            {item.isHidden && (
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                <EyeOff className="mr-1 size-2.5" />Hidden
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "path",
      header: "Path",
      cell: ({ row }) => <code className="text-xs text-muted-foreground">{row.original.path}</code>,
    },
    {
      accessorKey: "group",
      header: "Group",
      cell: ({ row }) => <Badge variant="secondary" className="text-[10px]">{row.original.group}</Badge>,
    },
    {
      accessorKey: "sortOrder",
      header: "Order",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.sortOrder}</span>,
    },
    {
      id: "roles",
      header: "Roles",
      cell: ({ row }) => {
        const item = row.original;
        const roles = item.roleMenus.map((rm) => rm.role.name);
        return (
          <div className="flex flex-wrap gap-1">
            {roles.length === 0 ? (
              <span className="text-[10px] text-muted-foreground italic">No roles</span>
            ) : (
              roles.map((r) => (
                <span key={r} className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${roleColors[r] ?? "bg-muted text-muted-foreground"}`}>
                  {r}
                </span>
              ))
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex justify-end gap-1">
            {canManage && (
              <Button
                variant="ghost" size="icon" className="size-8"
                title="Toggle expand"
                onClick={() => setExpandedRow(expandedRow === item.id ? null : item.id)}
              >
                {expandedRow === item.id ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              </Button>
            )}
            {canManage && (
              <Button variant="ghost" size="icon" className="size-8" title="Edit" onClick={() => openEdit(item)}>
                <Pencil className="size-3.5" />
              </Button>
            )}
            {canManage && (deleteConfirm === item.id ? (
              <div className="flex items-center gap-1">
                <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => deleteMutation.mutate(item.id)}>Confirm</Button>
                <Button variant="ghost" size="icon" className="size-8" title="Cancel" onClick={() => setDeleteConfirm(null)}>
                  <X className="size-3.5" />
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" title="Delete" onClick={() => setDeleteConfirm(item.id)}>
                <Trash2 className="size-3.5" />
              </Button>
            ))}
          </div>
        );
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [deleteConfirm, canManage, expandedRow]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sidebar Configuration</h1>
          <p className="mt-1 text-sm text-muted-foreground">Control which menu items each role can see in the sidebar</p>
        </div>
        {canManage && (
          <Button onClick={openAdd}><Plus className="mr-2 size-4" />Add Menu Item</Button>
        )}
      </div>

      {/* ─── Grouped Preview ─── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {GROUPS.map((group) => {
          const items = grouped[group] ?? [];
          if (items.length === 0) return null;
          return (
            <Card key={group}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{group}</CardTitle>
                <CardDescription className="text-[10px]">{items.length} item{items.length !== 1 ? "s" : ""}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-md border px-2 py-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <IconBadge name={item.icon} />
                        <span className="truncate text-xs font-medium">{item.label}</span>
                        {item.isHidden && <EyeOff className="size-2.5 text-muted-foreground" />}
                      </div>
                      <div className="flex gap-0.5">
                        {item.roleMenus.map((rm) => (
                          <span key={rm.roleId} className={`rounded px-1 py-0.5 text-[8px] font-medium ${roleColors[rm.role.name] ?? "bg-muted text-muted-foreground"}`}>
                            {rm.role.name.slice(0, 3)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─── Full Table ─── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Menu Items</CardTitle>
          <CardDescription>Manage sidebar menu visibility and role assignments</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={menuItems}
            pageCount={1}
            pagination={{ pageIndex: 0, pageSize: 100 }}
            onPaginationChange={() => {}}
            isLoading={isLoading}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <LayoutDashboard className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No menu items configured yet</p>
                <p className="text-xs text-muted-foreground">Click "Add Menu Item" to get started</p>
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* ─── Inline Role Assignment (expanded rows) ─── */}
      {expandedRow && (() => {
        const item = menuItems.find((m) => m.id === expandedRow);
        if (!item) return null;
        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <IconBadge name={item.icon} />
                Assign Roles — {item.label}
              </CardTitle>
              <CardDescription>Toggle which roles can see this menu item in the sidebar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {allRoles.map((role) => {
                  const assigned = item.roleMenus.some((rm) => rm.roleId === role.id);
                  return (
                    <button
                      key={role.id}
                      onClick={() => {
                        const newRoleIds = assigned
                          ? item.roleMenus.filter((rm) => rm.roleId !== role.id).map((rm) => rm.roleId)
                          : [...item.roleMenus.map((rm) => rm.roleId), role.id];
                        assignRolesMutation.mutate({ id: item.id, roleIds: newRoleIds });
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                        assigned
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {assigned ? <Check className="size-3" /> : <X className="size-3 opacity-30" />}
                      {role.name}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* ─── Create / Edit Sheet ─── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle>{editingId ? "Edit Menu Item" : "Add Menu Item"}</SheetTitle>
            <SheetDescription>
              {editingId ? "Update this sidebar menu item." : "Add a new item to the sidebar navigation."}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto space-y-4 px-4 pt-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="m-label">Label *</FieldLabel>
                <Input id="m-label" placeholder="e.g. Appointments" value={formLabel} onChange={(e) => setFormLabel(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="m-path">Path *</FieldLabel>
                <Input id="m-path" placeholder="e.g. /appointments" value={formPath} onChange={(e) => setFormPath(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="m-icon">Icon Name</FieldLabel>
                <Input id="m-icon" placeholder="e.g. CalendarClock" value={formIcon} onChange={(e) => setFormIcon(e.target.value)} />
                <p className="text-[10px] text-muted-foreground mt-1">Lucide icon name (optional)</p>
              </Field>
              <Field>
                <FieldLabel htmlFor="m-group">Group *</FieldLabel>
                <select
                  id="m-group"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={formGroup}
                  onChange={(e) => setFormGroup(e.target.value)}
                >
                  {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="m-sort">Sort Order</FieldLabel>
                <Input id="m-sort" type="number" value={formSortOrder} onChange={(e) => setFormSortOrder(Number(e.target.value))} />
              </Field>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="m-hidden"
                  checked={formIsHidden}
                  onCheckedChange={(v: boolean | "indeterminate") => setFormIsHidden(v === true)}
                />
                <label htmlFor="m-hidden" className="text-sm">Globally hidden</label>
              </div>
            </FieldGroup>

            <Separator className="my-2" />            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Visible to Roles</h3>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setFormRoleIds(allRoles.map((r) => r.id))}
                    className="text-[10px] text-primary hover:underline"
                  >
                    All
                  </button>
                  <span className="text-muted-foreground">|</span>
                  <button
                    type="button"
                    onClick={() => setFormRoleIds([])}
                    className="text-[10px] text-muted-foreground hover:underline"
                  >
                    None
                  </button>
                </div>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">Select which roles can see this menu item.</p>
              <div className="flex flex-wrap gap-2">
                {allRoles.map((role) => {
                  const selected = formRoleIds.includes(role.id);
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => toggleRole(role.id)}
                      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input text-muted-foreground hover:bg-muted"
                      }`}>
                      {selected && <Check className="size-3" />}
                      {role.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="px-4 pb-4">
            <SheetFooter>
              <Button variant="outline" onClick={closeSheet}>Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={!formLabel.trim() || !formPath.trim() || createMutation.isPending || updateMutation.isPending}
              >
                {editingId ? "Save Changes" : "Create"}
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
