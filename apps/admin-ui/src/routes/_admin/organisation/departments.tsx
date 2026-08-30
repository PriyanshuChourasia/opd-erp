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
import { Badge } from "@/components/ui/badge";
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
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from "@/features/departments/hooks";
import type { Department } from "@/features/departments/interface";
import { departmentFormSchema, type DepartmentFormValues } from "@/features/departments/schema";

export const Route = createFileRoute("/_admin/organisation/departments")({
  component: DepartmentsPage,
});

const PAGE_SIZE = 8;

export function StatusBadge({ status }: { status?: string | null }) {
  return (
    <Badge variant={status === "active" ? "default" : "secondary"}>
      {status ?? "—"}
    </Badge>
  );
}

function DepartmentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<
    { mode: "create" } | { mode: "edit"; department: Department } | null
  >(null);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const list = useDepartments({ page, limit: PAGE_SIZE, search: query });
  const create = useCreateDepartment();
  const update = useUpdateDepartment();
  const remove = useDeleteDepartment();

  const rows = list.data?.data ?? [];
  const meta = list.data?.meta;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Departments</h1>
          <p className="text-sm text-muted-foreground">
            Manage teams and business units.
          </p>
        </div>
        <Button onClick={() => setDialog({ mode: "create" })}>
          <Plus /> Add department
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
              placeholder="Search by name or code…"
              className="pl-9"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.isPending ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No departments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell><Badge variant="outline">{d.code || "—"}</Badge></TableCell>
                      <TableCell className="max-w-[260px] truncate text-muted-foreground">
                        {d.description || "—"}
                      </TableCell>
                      <TableCell><StatusBadge status={d.status} /></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <span className="sr-only">Actions</span>
                              <span className="text-muted-foreground">···</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{d.name}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDialog({ mode: "edit", department: d })}>
                              <Pencil /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              disabled={remove.isPending}
                              onClick={() => {
                                if (!window.confirm(`Delete department "${d.name}"?`)) return;
                                remove.mutate(d.id);
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
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1 || list.isPending}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {meta.page} of {meta.totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= meta.totalPages || list.isPending}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {dialog && (
        <DepartmentDialog
          open
          mode={dialog.mode}
          department={dialog.mode === "edit" ? dialog.department : undefined}
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          isPending={create.isPending || update.isPending}
          onSubmit={(values) => {
            if (dialog.mode === "create") {
              create.mutate(values, { onSuccess: () => setDialog(null) });
            } else {
              update.mutate(
                {
                  id: dialog.department.id,
                  input: values,
                },
                { onSuccess: () => setDialog(null) },
              );
            }
          }}
        />
      )}
    </div>
  );
}

function DepartmentDialog({
  open,
  mode,
  department,
  onOpenChange,
  isPending,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  department?: Department;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onSubmit: (values: DepartmentFormValues) => void;
}) {
  const form = useForm({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: department?.name ?? "",
      code: department?.code ?? "",
      description: department?.description ?? "",
      status: (department?.status as "active" | "inactive") ?? "active",
    },
  });

  useEffect(() => {
    form.reset({
      name: department?.name ?? "",
      code: department?.code ?? "",
      description: department?.description ?? "",
      status: (department?.status as "active" | "inactive") ?? "active",
    });
  }, [department, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add department" : `Edit ${department?.name ?? "department"}`}
          </DialogTitle>
          <DialogDescription>Department details used across the organisation.</DialogDescription>
        </DialogHeader>
        <form
          id="department-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name *</FieldLabel>
              <Input id="name" placeholder="e.g. Cardiology" {...form.register("name")} />
              <FieldError errors={form.formState.errors.name ? [form.formState.errors.name] : undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="code">Code</FieldLabel>
              <Input id="code" placeholder="e.g. CARD" {...form.register("code")} />
              <FieldError errors={form.formState.errors.code ? [form.formState.errors.code] : undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea id="description" rows={2} {...form.register("description")} />
              <FieldError errors={form.formState.errors.description ? [form.formState.errors.description] : undefined} />
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
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="department-form" disabled={isPending}>
            {mode === "create" ? "Create department" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}