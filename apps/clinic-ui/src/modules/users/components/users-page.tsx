import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Plus, Search, Users as UsersIcon, Pencil, X, UserX, RotateCcw, Shield, Mail, User as UserIcon } from "lucide-react";
import {
  fetchUsers, fetchUser, createUser, updateUser, deleteUser, restoreUser, fetchUserRoles,
  type User, type CreateUserInput, type UpdateUserInput, type RoleOption,
} from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { initials } from "@/lib/utils";
import { DataTable } from "@/components/data-table/data-table";

const emptyForm = (): CreateUserInput & Partial<UpdateUserInput> => ({
  firstName: "",
  lastName: "",
  email: "",
  username: "",
  password: "",
  roleId: "",
  mobileNumber: "",
});

export function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showDropped, setShowDropped] = useState(false);

  const [form, setForm] = useState<CreateUserInput & Partial<UpdateUserInput>>(emptyForm());

  const { data: response, isLoading } = useQuery({
    queryKey: ["users", search, showDropped, pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      fetchUsers({
        search: search || undefined,
        isActive: showDropped ? "false" : "true",
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      }),
    placeholderData: (previous) => previous,
  });

  const users = response?.data ?? [];
  const pageCount = response?.meta?.totalPages ?? 0;

  // Fetch available roles for the form dropdown
  const { data: roles = [] } = useQuery({
    queryKey: ["user-roles"],
    queryFn: fetchUserRoles,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeSheet();
      toast.success("User created successfully");
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeSheet();
      toast.success("User updated successfully");
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteConfirm(null);
      toast.success("User deactivated — can be restored anytime");
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  const restoreMutation = useMutation({
    mutationFn: restoreUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteConfirm(null);
      toast.success("User restored successfully");
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm());
    setSheetOpen(true);
  }

  async function openEdit(id: string) {
    setEditingId(id);
    try {
      const user = await queryClient.fetchQuery({
        queryKey: ["user", id],
        queryFn: () => fetchUser(id),
      });
      setForm({
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName ?? undefined,
        email: user.email,
        username: user.username,
        mobileNumber: user.mobileNumber ?? undefined,
        countryCode: user.countryCode,
        gender: user.gender ?? undefined,
        roleId: user.roleId,
        password: "",
      });
    } catch {
      toast.error("Failed to load user details");
      return;
    }
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditingId(null);
  }

  function handleSave() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) return;

    if (editingId) {
      // Build the update payload — exclude empty password (leave blank = keep)
      const payload: UpdateUserInput = { ...form };
      if (!payload.password) delete payload.password;
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      if (!form.password || !form.roleId) return;
      createMutation.mutate(form as CreateUserInput);
    }
  }

  const columns = useMemo<ColumnDef<User>[]>(() => [
    {
      id: "name",
      header: "Name",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">{initials(user.firstName)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="truncate font-medium text-sm">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: "role",
      header: "Role",
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-xs">
          <Shield className="size-3 text-muted-foreground" />
          <Badge variant="secondary">{row.original.role.name}</Badge>
        </span>
      ),
    },
    {
      accessorKey: "mobileNumber",
      header: "Mobile",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.mobileNumber ?? "—"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const active = row.original.isActive;
        return active
          ? <Badge variant="default" className="bg-green-600/10 text-green-600 text-[10px]">Active</Badge>
          : <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed">Inactive</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex justify-end gap-1">
            {user.isActive ? (
              <>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(user.id)}>
                  <Pencil className="size-3.5" />
                </Button>
                {deleteConfirm === user.id ? (
                  <div className="flex items-center gap-1">
                    <Button variant="secondary" size="sm" className="h-8 text-xs" onClick={() => deleteMutation.mutate(user.id)}>
                      Deactivate
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => setDeleteConfirm(null)}>
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-amber-600"
                    title="Deactivate user"
                    onClick={() => setDeleteConfirm(user.id)}
                  >
                    <UserX className="size-3.5" />
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="ghost" size="icon" className="size-8" title="Restore" onClick={() => restoreMutation.mutate(user.id)}>
                  <RotateCcw className="size-3.5" />
                </Button>
                <span className="text-[10px] text-muted-foreground italic">Deactivated</span>
              </>
            )}
          </div>
        );
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [deleteConfirm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage team members, roles, and account access</p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button onClick={openAdd}><Plus className="mr-2 size-4" />Add User</Button>
          </SheetTrigger>
          <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingId ? "Edit User" : "Add User"}</SheetTitle>
              <SheetDescription>
                {editingId
                  ? "Update user account details and role."
                  : "Create a new user account with role assignment."}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-5 px-4 pb-4 pt-5">
              <FieldGroup>
                {/* ─── Account Section ─── */}
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                   <UserIcon className="size-4" />
                  <span>Account Details</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="u-first">First Name *</FieldLabel>
                    <Input
                      id="u-first"
                      placeholder="John"
                      value={form.firstName ?? ""}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="u-last">Last Name *</FieldLabel>
                    <Input
                      id="u-last"
                      placeholder="Doe"
                      value={form.lastName ?? ""}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="u-email">Email *</FieldLabel>
                  <Input
                    id="u-email"
                    type="email"
                    placeholder="user@clinic.com"
                    value={form.email ?? ""}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="u-username">Username *</FieldLabel>
                    <Input
                      id="u-username"
                      placeholder="johndoe"
                      value={form.username ?? ""}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="u-password">
                      {editingId ? "New Password (leave blank to keep)" : "Password *"}
                    </FieldLabel>
                    <Input
                      id="u-password"
                      type="password"
                      placeholder={editingId ? "Unchanged" : "Min 8 chars"}
                      value={form.password ?? ""}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="u-mobile">Mobile Number</FieldLabel>
                  <Input
                    id="u-mobile"
                    placeholder="+919810000001"
                    value={form.mobileNumber ?? ""}
                    onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
                  />
                </Field>

                <Separator className="my-2" />

                {/* ─── Role & Permissions ─── */}
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Shield className="size-4" />
                  <span>Role &amp; Permissions</span>
                </div>
                <Field>
                  <FieldLabel htmlFor="u-role">Role *</FieldLabel>
                  <Select
                    value={form.roleId ?? ""}
                    onValueChange={(v) => setForm({ ...form, roleId: v })}
                  >
                    <SelectTrigger id="u-role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={closeSheet}>Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={
                  !form.firstName.trim() ||
                  !form.lastName.trim() ||
                  !form.email.trim() ||
                  (!editingId && (!form.password || !form.roleId)) ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
              >
                {editingId ? "Save Changes" : "Create User"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader className="pb-3 space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant={!showDropped ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => { setShowDropped(false); setPagination((p) => ({ ...p, pageIndex: 0 })); setDeleteConfirm(null); }}
            >
              Active
            </Button>
            <Button
              variant={showDropped ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => { setShowDropped(true); setPagination((p) => ({ ...p, pageIndex: 0 })); setDeleteConfirm(null); }}
            >
              <UserX className="mr-1 size-3" />
              Deactivated
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={showDropped ? "Search deactivated users..." : "Search by name or email..."}
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={users}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                {showDropped ? <UserX className="size-8 text-muted-foreground/50" /> : <UsersIcon className="size-8 text-muted-foreground/50" />}
                <p className="text-sm text-muted-foreground">
                  {search ? "No users found" : showDropped ? "No deactivated users" : "No users yet"}
                </p>
                {showDropped && !search && (
                  <p className="text-xs text-muted-foreground">Deactivated users can be restored anytime.</p>
                )}
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
