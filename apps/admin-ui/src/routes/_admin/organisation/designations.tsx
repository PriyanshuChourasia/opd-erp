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
import { Textarea } from "@/components/ui/textarea";
import { useDepartments } from "@/features/departments/hooks";
import {
  useDesignations,
  useCreateDesignation,
  useUpdateDesignation,
  useDeleteDesignation,
} from "@/features/designations/hooks";
import type { Designation } from "@/features/designations/interface";
import { designationFormSchema, type DesignationFormValues } from "@/features/designations/schema";
import { StatusBadge } from "./departments";

export const Route = createFileRoute("/_admin/organisation/designations")({
  component: DesignationsPage,
});

const PAGE_SIZE = 8;

function DesignationsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<
    { mode: "create" } | { mode: "edit"; designation: Designation } | null
  >(null);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const list = useDesignations({ page, limit: PAGE_SIZE, search: query });
  const departments = useDepartments({ page: 1, limit: 100, search: "" });
  const create = useCreateDesignation();
  const update = useUpdateDesignation();
  const remove = useDeleteDesignation();

  const rows = list.data?.data ?? [];
  const meta = list.data?.meta;
  const deptName = (id: number) =>
    departments.data?.data.find((d) => Number(d.id) === id)?.name ?? "—";

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Designations</h1>
          <p className="text-sm text-muted-foreground">
            Roles and job titles within a department.
          </p>
        </div>
        <Button onClick={() => setDialog({ mode: "create" })}>
          <Plus /> Add designation
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
              placeholder="Search by name…"
              className="pl-9"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.isPending ? (
                  <TableRow><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No designations found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell>{deptName(d.department_id)}</TableCell>
                      <TableCell className="max-w-[240px] truncate text-muted-foreground">
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
                            <DropdownMenuItem onClick={() => setDialog({ mode: "edit", designation: d })}>
                              <Pencil /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              disabled={remove.isPending}
                              onClick={() => {
                                if (!window.confirm(`Delete designation "${d.name}"?`)) return;
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
        <DesignationDialog
          open
          mode={dialog.mode}
          designation={dialog.mode === "edit" ? dialog.designation : undefined}
          departmentOptions={departments.data?.data ?? []}
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          isPending={create.isPending || update.isPending}
          onSubmit={(values) => {
            const input = {
              name: values.name,
              description: values.description || null,
              status: values.status,
              department_id: Number(values.department_id),
            };
            if (dialog.mode === "create") {
              create.mutate(input, { onSuccess: () => setDialog(null) });
            } else {
              update.mutate(
                { id: dialog.designation.id, input },
                { onSuccess: () => setDialog(null) },
              );
            }
          }}
        />
      )}
    </div>
  );
}

function DesignationDialog({
  open,
  mode,
  designation,
  departmentOptions,
  onOpenChange,
  isPending,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  designation?: Designation;
  departmentOptions: { id: string; name: string }[];
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onSubmit: (values: DesignationFormValues) => void;
}) {
  const form = useForm({
    resolver: zodResolver(designationFormSchema),
    defaultValues: {
      name: designation?.name ?? "",
      description: designation?.description ?? "",
      status: (designation?.status as "active" | "inactive") ?? "active",
      department_id: designation ? String(designation.department_id) : "",
    },
  });

  useEffect(() => {
    form.reset({
      name: designation?.name ?? "",
      description: designation?.description ?? "",
      status: (designation?.status as "active" | "inactive") ?? "active",
      department_id: designation ? String(designation.department_id) : "",
    });
  }, [designation, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add designation" : `Edit ${designation?.name ?? "designation"}`}
          </DialogTitle>
          <DialogDescription>Job titles scoped to a department.</DialogDescription>
        </DialogHeader>
        <form
          id="designation-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name *</FieldLabel>
              <Input id="name" placeholder="e.g. Senior Consultant" {...form.register("name")} />
              <FieldError errors={form.formState.errors.name ? [form.formState.errors.name] : undefined} />
            </Field>
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
          <Button type="submit" form="designation-form" disabled={isPending}>
            {mode === "create" ? "Create designation" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}