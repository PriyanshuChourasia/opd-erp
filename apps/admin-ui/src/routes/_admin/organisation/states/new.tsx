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
import { useCountries } from "@/features/countries/hooks";
import { useCreateState } from "@/features/states/hooks";
import { stateFormSchema } from "@/features/states/schema";

export const Route = createFileRoute("/_admin/organisation/states/new")({
  component: NewStatePage,
});

function NewStatePage() {
  const navigate = useNavigate();
  const countries = useCountries({ page: 1, limit: 100, search: "" });
  const create = useCreateState();
  const form = useForm({
    resolver: zodResolver(stateFormSchema),
    defaultValues: { name: "", code: "", country_id: "", status: "active" },
  });

  return (
    <EntityFormPage
      backTo="/organisation/states"
      backLabel="Back to states"
      title="Add state"
      description="State/province scoped to a country."
      formId="state-form"
      submitLabel="Create state"
      isPending={create.isPending}
      cancelTo="/organisation/states"
    >
      <form
        id="state-form"
        onSubmit={form.handleSubmit((values) =>
          create.mutate(
            {
              name: values.name,
              code: values.code || null,
              country_id: Number(values.country_id),
              status: values.status,
            },
            { onSuccess: () => navigate({ to: "/organisation/states" }) },
          ),
        )}
        className="flex flex-col gap-4"
      >
        <Field>
          <FieldLabel>Country *</FieldLabel>
          <Controller
            control={form.control}
            name="country_id"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  {(countries.data?.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={form.formState.errors.country_id ? [form.formState.errors.country_id] : undefined} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="name">Name *</FieldLabel>
            <Input id="name" placeholder="e.g. Maharashtra" {...form.register("name")} />
            <FieldError errors={form.formState.errors.name ? [form.formState.errors.name] : undefined} />
          </Field>
          <Field>
            <FieldLabel htmlFor="code">Code</FieldLabel>
            <Input id="code" placeholder="e.g. MH" maxLength={10} {...form.register("code")} />
            <FieldError errors={form.formState.errors.code ? [form.formState.errors.code] : undefined} />
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