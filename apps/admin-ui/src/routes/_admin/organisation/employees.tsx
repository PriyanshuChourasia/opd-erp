import { createFileRoute } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
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
import { useDepartments } from "@/features/departments/hooks";
import { useDesignations } from "@/features/designations/hooks";
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from "@/features/employees/hooks";
import type { Employee } from "@/features/employees/interface";
import { employeeFormSchema, type EmployeeFormValues } from "@/features/employees/schema";
import { useUsers } from "@/features/users/hooks";
import type { User } from "@/features/users/interface";
import { StatusBadge } from "./departments";

export const Route = createFileRoute("/_admin/organisation/employees")({
  component: EmployeesPage,
});

const PAGE_SIZE = 8;
const NONE = "__none__";

function EmployeesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<
    { mode: "create" } | { mode: "edit"; employee: Employee } | null
  >(null);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const list = useEmployees({ page, limit: PAGE_SIZE, search: query });
  const departments = useDepartments({ page: 1, limit: 100, search: "" });
  const designations = useDesignations({ page: 1, limit: 100, search: "" });
  const users = useUsers({ page: 1, limit: 100, search: "" });
  const create = useCreateEmployee();
  const update = useUpdateEmployee();
  const remove = useDeleteEmployee();

  const rows = list.data?.data ?? [];
  const meta = list.data?.meta;
  const deptName = (id: number) =>
    departments.data?.data.find((d) => Number(d.id) === id)?.name ?? "—";
  const desigName = (id: number) =>
    designations.data?.data.find((d) => Number(d.id) === id)?.name ?? "—";

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground">
            Staff members, their role and login account.
          </p>
        </div>
        <Button onClick={() => setDialog({ mode: "create" })}>
          <Plus /> Add employee
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setQuery(search);
              }}
              placeholder="Search by name or email…"
              className="pl-9"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.isPending ? (
                  <TableRow><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No employees found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">
                        {e.first_name} {e.last_name || ""}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{e.email}</TableCell>
                      <TableCell>{deptName(e.department_id)}</TableCell>
                      <TableCell>{desigName(e.designation_id)}</TableCell>
                      <TableCell><StatusBadge status={e.status} /></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <span className="sr-only">Actions</span>
                              <span className="text-muted-foreground">···</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{e.first_name} {e.last_name || ""}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDialog({ mode: "edit", employee: e })}>
                              <Pencil /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              disabled={remove.isPending}
                              onClick={() => {
                                if (!window.confirm(`Delete employee "${e.first_name} ${e.last_name || ""}"?`)) return;
                                remove.mutate(e.id);
                              }}
                            >
                              <Trash2 /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-end gap-3">
              <Button size="sm" variant="outline" disabled={page <= 1 || list.isPending} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {meta.page} of {meta.totalPages}
              </span>
              <Button size="sm" variant="outline" disabled={page >= meta.totalPages || list.isPending} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {dialog && (
        <EmployeeDialog
          open
          mode={dialog.mode}
          employee={dialog.mode === "edit" ? dialog.employee : undefined}
          departmentOptions={departments.data?.data ?? []}
          designationOptions={designations.data?.data ?? []}
          userOptions={users.data?.data ?? []}
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          isPending={create.isPending || update.isPending}
          onSubmit={(values) => {
            const input = {
              first_name: values.first_name,
              last_name: values.last_name || null,
              email: values.email,
              phone: values.phone || null,
              gender: values.gender || null,
              date_of_joining: values.date_of_joining || null,
              status: values.status,
              department_id: Number(values.department_id),
              designation_id: Number(values.designation_id),
              user_id: values.user_id === NONE ? null : Number(values.user_id),
            };
            if (dialog.mode === "create") {
              create.mutate(input, { onSuccess: () => setDialog(null) });
            } else {
              update.mutate(
                { id: dialog.employee.id, input },
                { onSuccess: () => setDialog(null) },
              );
            }
          }}
        />
      )}
    </div>
  );
}

function EmployeeDialog({
  open,
  mode,
  employee,
  departmentOptions,
  designationOptions,
  userOptions,
  onOpenChange,
  isPending,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  employee?: Employee;
  departmentOptions: { id: string; name: string }[];
  designationOptions: { id: string; name: string }[];
  userOptions: User[];
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onSubmit: (values: EmployeeFormValues) => void;
}) {
  const form = useForm({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      first_name: employee?.first_name ?? "",
      last_name: employee?.last_name ?? "",
      email: employee?.email ?? "",
      phone: employee?.phone ?? "",
      gender: employee?.gender ?? "",
      date_of_joining: employee?.date_of_joining ?? "",
      status: (employee?.status as "active" | "inactive") ?? "active",
      department_id: employee ? String(employee.department_id) : "",
      designation_id: employee ? String(employee.designation_id) : "",
      user_id: employee?.user_id ? String(employee.user_id) : NONE,
    },
  });

  useEffect(() => {
    form.reset({
      first_name: employee?.first_name ?? "",
      last_name: employee?.last_name ?? "",
      email: employee?.email ?? "",
      phone: employee?.phone ?? "",
      gender: employee?.gender ?? "",
      date_of_joining: employee?.date_of_joining ?? "",
      status: (employee?.status as "active" | "inactive") ?? "active",
      department_id: employee ? String(employee.department_id) : "",
      designation_id: employee ? String(employee.designation_id) : "",
      user_id: employee?.user_id ? String(employee.user_id) : NONE,
    });
  }, [employee, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add employee" : `Edit ${employee?.first_name ?? "employee"}`}
          </DialogTitle>
          <DialogDescription>Staff profile, role and linked login account.</DialogDescription>
        </DialogHeader>
        <form
          id="employee-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="first_name">First name *</FieldLabel>
              <Input id="first_name" {...form.register("first_name")} />
              <FieldError errors={form.formState.errors.first_name ? [form.formState.errors.first_name] : undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="last_name">Last name</FieldLabel>
              <Input id="last_name" {...form.register("last_name")} />
              <FieldError errors={form.formState.errors.last_name ? [form.formState.errors.last_name] : undefined} />
            </Field>
          </div>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email *</FieldLabel>
              <Input id="email" type="email" autoComplete="off" {...form.register("email")} />
              <FieldError errors={form.formState.errors.email ? [form.formState.errors.email] : undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="phone">Phone</FieldLabel>
              <Input id="phone" type="tel" {...form.register("phone")} />
              <FieldError errors={form.formState.errors.phone ? [form.formState.errors.phone] : undefined} />
            </Field>
          </FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Gender</FieldLabel>
              <Controller
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={form.formState.errors.gender ? [form.formState.errors.gender] : undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="date_of_joining">Date of joining</FieldLabel>
              <Input id="date_of_joining" type="date" {...form.register("date_of_joining")} />
              <FieldError errors={form.formState.errors.date_of_joining ? [form.formState.errors.date_of_joining] : undefined} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Department *</FieldLabel>
              <Controller
                control={form.control}
                name="department_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {departmentOptions.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={form.formState.errors.department_id ? [form.formState.errors.department_id] : undefined} />
            </Field>
            <Field>
              <FieldLabel>Designation *</FieldLabel>
              <Controller
                control={form.control}
                name="designation_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                    <SelectContent>
                      {designationOptions.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={form.formState.errors.designation_id ? [form.formState.errors.designation_id] : undefined} />
            </Field>
          </div>
          <Field>
            <FieldLabel>Link to login account</FieldLabel>
            <Controller
              control={form.control}
              name="user_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>No login account</SelectItem>
                    {userOptions.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={form.formState.errors.user_id ? [form.formState.errors.user_id] : undefined} />
          </Field>
          <Field>
            <FieldLabel>Status</FieldLabel>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={form.formState.errors.status ? [form.formState.errors.status] : undefined} />
          </Field>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="employee-form" disabled={isPending}>
            {mode === "create" ? "Create employee" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}