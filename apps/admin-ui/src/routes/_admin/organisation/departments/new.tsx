import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import { useCreateDepartment } from "@/features/departments/hooks";
import { departmentFormSchema } from "@/features/departments/schema";

export const Route = createFileRoute("/_admin/organisation/departments/new")({
  component: NewDepartmentPage,
});

function NewDepartmentPage() {
  const navigate = useNavigate();
  const create = useCreateDepartment();
  const form = useForm({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: { name: "", code: "", description: "", status: "active" },
  });

  return (
    <EntityFormPage
      backTo="/organisation/departments"
      backLabel="Back to departments"
      title="Add department"
      description="Department details used across the organisation."
      formId="department-form"
      submitLabel="Create department"
      isPending={create.isPending}
      cancelTo="/organisation/departments"
    >
      <form
        id="department-form"
        onSubmit={form.handleSubmit((values) =>
          create.mutate(
            {
              name: values.name,
              code: values.code || null,
              description: values.description || null,
              status: values.status,
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
    </EntityFormPage>
  );
}