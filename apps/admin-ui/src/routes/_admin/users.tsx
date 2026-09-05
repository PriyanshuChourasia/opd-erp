import { createFileRoute } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from "@/features/users/hooks";
import type { User } from "@/features/users/interface";
import {
  createUserFormSchema,
  editUserFormSchema,
  type UserFormValues,
} from "@/features/users/schema";

export const Route = createFileRoute("/_admin/users")({
  component: UsersPage,
});

const PAGE_SIZE = 8;

function UsersPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<
    { mode: "create" } | { mode: "edit"; user: User } | null
  >(null);

  const users = useUsers({ page, limit: PAGE_SIZE, search });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const meta = users.data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  const handleDelete = (user: User) => {
    if (!window.confirm(`Delete ${user.name} (${user.email})?`)) return;
    deleteUser.mutate(user.id);
  };

  return (
    <>
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage accounts that can sign in to the admin console.
          </p>
        </div>
        <Button type="button" onClick={() => setDialog({ mode: "create" })}>
          <Plus />
          Add user
        </Button>
      </section>

      <Card>
        <CardContent className="px-0 py-0">
          <div className="border-b px-4 py-3">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by name or email…"
                className="pl-9"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.isPending ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 5 }).map((__, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : users.data && users.data.data.length > 0 ? (
                users.data.data.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <UserRound className="size-4" />
                        </span>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{user.id}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="More">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDialog({ mode: "edit", user })}
                          >
                            <Pencil />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => handleDelete(user)}
                          >
                            <Trash2 />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                      {search ? "No users match your search." : "No users yet."}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
            <span>
              {meta
                ? `Page ${meta.page} of ${Math.max(meta.totalPages, 1)} · ${meta.total} users`
                : "Loading…"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || users.isPending}
              >
                <ChevronLeft />
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={(totalPages ?? 1) <= page || users.isPending}
              >
                Next
                <ChevronRight />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {dialog && (
        <UserFormDialog
          open
          mode={dialog.mode}
          user={dialog.mode === "edit" ? dialog.user : undefined}
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          isPending={createUser.isPending || updateUser.isPending}
          onSubmit={(values) => {
            if (dialog.mode === "create") {
              createUser.mutate(values, {
                onSuccess: () => setDialog(null),
              });
            } else {
              updateUser.mutate(
                {
                  id: dialog.user.id,
                  input: {
                    name: values.name,
                    email: values.email,
                    ...(values.password ? { password: values.password } : {}),
                    phone: values.phone || null,
                    gender: values.gender || null,
                    date_of_birth: values.date_of_birth || null,
                    address: values.address || null,
                    city: values.city || null,
                    state: values.state || null,
                    country: values.country || null,
                    pincode: values.pincode || null,
                    avatar_url: values.avatar_url || null,
                    status: values.status,
                  },
                },
                {
                  onSuccess: () => setDialog(null),
                },
              );
            }
          }}
        />
      )}
    </>
  );
}

function UserFormDialog({
  open,
  mode,
  user,
  onOpenChange,
  isPending,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  user?: User;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onSubmit: (values: UserFormValues) => void;
}) {
  const schema = mode === "create" ? createUserFormSchema : editUserFormSchema;
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      password: "",
      phone: user?.phone ?? "",
      gender: user?.gender ?? "",
      date_of_birth: user?.date_of_birth ?? "",
      address: user?.address ?? "",
      city: user?.city ?? "",
      state: user?.state ?? "",
      country: user?.country ?? "",
      pincode: user?.pincode ?? "",
      avatar_url: user?.avatar_url ?? "",
      status: (user?.status as "active" | "inactive") ?? "active",
    },
  });

  useEffect(() => {
    form.reset({
      name: user?.name ?? "",
      email: user?.email ?? "",
      password: "",
      phone: user?.phone ?? "",
      gender: user?.gender ?? "",
      date_of_birth: user?.date_of_birth ?? "",
      address: user?.address ?? "",
      city: user?.city ?? "",
      state: user?.state ?? "",
      country: user?.country ?? "",
      pincode: user?.pincode ?? "",
      avatar_url: user?.avatar_url ?? "",
      status: (user?.status as "active" | "inactive") ?? "active",
    });
  }, [user, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add user" : `Edit ${user?.name ?? "user"}`}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new account that can sign in to the admin console."
              : "Update the account details. Leave the password blank to keep it unchanged."}
          </DialogDescription>
        </DialogHeader>
        <form
          id="user-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name *</FieldLabel>
              <Input id="name" placeholder="e.g. Jane Doe" {...form.register("name")} />
              <FieldError
                errors={
                  form.formState.errors.name
                    ? [form.formState.errors.name]
                    : undefined
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email *</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="jane@opderp.com"
                autoComplete="off"
                {...form.register("email")}
              />
              <FieldError
                errors={
                  form.formState.errors.email
                    ? [form.formState.errors.email]
                    : undefined
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">
                Password {mode === "create" ? "*" : ""}
              </FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder={
                  mode === "edit"
                    ? "Leave blank to keep current password"
                    : "At least 8 characters"
                }
                {...form.register("password")}
              />
              <FieldError
                errors={
                  form.formState.errors.password
                    ? [form.formState.errors.password]
                    : undefined
                }
              />
            </Field>
          </FieldGroup>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="phone">Phone</FieldLabel>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                {...form.register("phone")}
              />
              <FieldError
                errors={
                  form.formState.errors.phone
                    ? [form.formState.errors.phone]
                    : undefined
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="date_of_birth">Date of birth</FieldLabel>
              <Input id="date_of_birth" type="date" {...form.register("date_of_birth")} />
              <FieldError
                errors={
                  form.formState.errors.date_of_birth
                    ? [form.formState.errors.date_of_birth]
                    : undefined
                }
              />
            </Field>
            <Field>
              <FieldLabel>Gender</FieldLabel>
              <Controller
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError
                errors={
                  form.formState.errors.gender
                    ? [form.formState.errors.gender]
                    : undefined
                }
              />
            </Field>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError
                errors={
                  form.formState.errors.status
                    ? [form.formState.errors.status]
                    : undefined
                }
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="address">Address</FieldLabel>
            <Textarea
              id="address"
              placeholder="Street, area, landmark"
              rows={2}
              {...form.register("address")}
            />
            <FieldError
              errors={
                form.formState.errors.address
                  ? [form.formState.errors.address]
                  : undefined
              }
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="city">City</FieldLabel>
              <Input id="city" placeholder="e.g. Mumbai" {...form.register("city")} />
              <FieldError
                errors={
                  form.formState.errors.city
                    ? [form.formState.errors.city]
                    : undefined
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="state">State</FieldLabel>
              <Input
                id="state"
                placeholder="e.g. Maharashtra"
                {...form.register("state")}
              />
              <FieldError
                errors={
                  form.formState.errors.state
                    ? [form.formState.errors.state]
                    : undefined
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="country">Country</FieldLabel>
              <Input id="country" placeholder="e.g. India" {...form.register("country")} />
              <FieldError
                errors={
                  form.formState.errors.country
                    ? [form.formState.errors.country]
                    : undefined
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="pincode">Pin code</FieldLabel>
              <Input id="pincode" placeholder="e.g. 400001" {...form.register("pincode")} />
              <FieldError
                errors={
                  form.formState.errors.pincode
                    ? [form.formState.errors.pincode]
                    : undefined
                }
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="avatar_url">Avatar URL</FieldLabel>
            <Input
              id="avatar_url"
              placeholder="https://example.com/avatar.png"
              {...form.register("avatar_url")}
            />
            <FieldError
              errors={
                form.formState.errors.avatar_url
                  ? [form.formState.errors.avatar_url]
                  : undefined
              }
            />
          </Field>
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="user-form" disabled={isPending}>
            {mode === "create" ? "Create user" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}