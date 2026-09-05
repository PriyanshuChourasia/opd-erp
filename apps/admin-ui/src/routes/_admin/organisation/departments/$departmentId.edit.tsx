import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { EntityFormPage } from "@/components/entity-form-page";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useShowDepartment,
  useUpdateDepartment,
} from "@/features/departments/hooks";
import { departmentFormSchema } from "@/features/departments/schema";

export const Route = createFileRoute("/_admin/organisation/departments/$departmentId/edit")({
  component: EditDepartmentPage,
});

function EditDepartmentPage() {
  const { departmentId } = Route.useParams();
  const navigate = useNavigate();
  const show = useShowDepartment(departmentId);
  const update = useUpdateDepartment();
  const department = show.data;

  const form = useForm({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: { name: "", code: "", description: "", status: "active" },
  });

  useEffect(() => {
    if (department) {
      form.reset({
        name: department.name,
        code: department.code ?? "",
        description: department.description ?? "",
        status: (department.status as "active" | "inactive") ?? "active",
      });
    }
  }, [department, form]);

  return (
    <EntityFormPage
      backTo="/organisation/departments"
      backLabel="Back to departments"
      title={department ? `Edit ${department.name}` : "Edit department"}
      description="Update department details."
      formId="department-form"
      submitLabel="Save changes"
      isPending={update.isPending}
      cancelTo="/organisation/departments"
    >
      {show.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : (
        <form
          id="department-form"
          onSubmit={form.handleSubmit((values) =>
            update.mutate(
              {
                id: departmentId,
                input: {
                  name: values.name,
                  code: values.code || null,
                  description: values.description || null,
                  status: values.status,
                },
              },
              { onSuccess: () => navigate({ to: "/organisation/departments" }) },
            ),
          )}
          className="flex flex-col gap-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
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
        </form>
      )}
    </EntityFormPage>
  );
}