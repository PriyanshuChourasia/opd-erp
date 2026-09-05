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
import { useDepartments } from "@/features/departments/hooks";
import {
  useShowDesignation,
  useUpdateDesignation,
} from "@/features/designations/hooks";
import { designationFormSchema } from "@/features/designations/schema";

export const Route = createFileRoute("/_admin/organisation/designations/$designationId/edit")({
  component: EditDesignationPage,
});

function EditDesignationPage() {
  const { designationId } = Route.useParams();
  const navigate = useNavigate();
  const departments = useDepartments({ page: 1, limit: 100, search: "" });
  const show = useShowDesignation(designationId);
  const update = useUpdateDesignation();
  const designation = show.data;

  const form = useForm({
    resolver: zodResolver(designationFormSchema),
    defaultValues: { name: "", description: "", department_id: "", status: "active" },
  });

  useEffect(() => {
    if (designation) {
      form.reset({
        name: designation.name,
        description: designation.description ?? "",
        department_id: String(designation.department_id),
        status: (designation.status as "active" | "inactive") ?? "active",
      });
    }
  }, [designation, form]);

  return (
    <EntityFormPage
      backTo="/organisation/designations"
      backLabel="Back to designations"
      title={designation ? `Edit ${designation.name}` : "Edit designation"}
      description="Update designation details."
      formId="designation-form"
      submitLabel="Save changes"
      isPending={update.isPending}
      cancelTo="/organisation/designations"
    >
      {show.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : (
        <form
          id="designation-form"
          onSubmit={form.handleSubmit((values) =>
            update.mutate(
              {
                id: designationId,
                input: {
                  name: values.name,
                  description: values.description || null,
                  status: values.status,
                  department_id: Number(values.department_id),
                },
              },
              { onSuccess: () => navigate({ to: "/organisation/designations" }) },
            ),
          )}
          className="flex flex-col gap-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
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
                      {(departments.data?.data ?? []).map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={form.formState.errors.department_id ? [form.formState.errors.department_id] : undefined} />
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