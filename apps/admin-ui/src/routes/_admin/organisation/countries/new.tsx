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
import { useCreateCountry } from "@/features/countries/hooks";
import { countryFormSchema } from "@/features/countries/schema";

export const Route = createFileRoute("/_admin/organisation/countries/new")({
  component: NewCountryPage,
});

function NewCountryPage() {
  const navigate = useNavigate();
  const create = useCreateCountry();
  const form = useForm({
    resolver: zodResolver(countryFormSchema),
    defaultValues: { name: "", code: "", phone_code: "", status: "active" },
  });

  return (
    <EntityFormPage
      backTo="/organisation/countries"
      backLabel="Back to countries"
      title="Add country"
      description="Country details used across the organisation."
      formId="country-form"
      submitLabel="Create country"
      isPending={create.isPending}
      cancelTo="/organisation/countries"
    >
      <form
        id="country-form"
        onSubmit={form.handleSubmit((values) =>
          create.mutate(values, {
            onSuccess: () => navigate({ to: "/organisation/countries" }),
          }),
        )}
        className="flex flex-col gap-4"
      >
        <Field>
          <FieldLabel htmlFor="name">Name *</FieldLabel>
          <Input id="name" placeholder="e.g. India" {...form.register("name")} />
          <FieldError errors={form.formState.errors.name ? [form.formState.errors.name] : undefined} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="code">Code *</FieldLabel>
            <Input id="code" placeholder="e.g. IN" maxLength={10} {...form.register("code")} />
            <FieldError errors={form.formState.errors.code ? [form.formState.errors.code] : undefined} />
          </Field>
          <Field>
            <FieldLabel htmlFor="phone_code">Phone code</FieldLabel>
            <Input id="phone_code" placeholder="e.g. +91" maxLength={10} {...form.register("phone_code")} />
            <FieldError errors={form.formState.errors.phone_code ? [form.formState.errors.phone_code] : undefined} />
          </Field>
        </div>
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