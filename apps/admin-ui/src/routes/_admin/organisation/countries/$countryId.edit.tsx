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
import {
  useShowCountry,
  useUpdateCountry,
} from "@/features/countries/hooks";
import { countryFormSchema } from "@/features/countries/schema";

export const Route = createFileRoute("/_admin/organisation/countries/$countryId/edit")({
  component: EditCountryPage,
});

function EditCountryPage() {
  const { countryId } = Route.useParams();
  const navigate = useNavigate();
  const show = useShowCountry(countryId);
  const update = useUpdateCountry();
  const country = show.data;

  const form = useForm({
    resolver: zodResolver(countryFormSchema),
    defaultValues: { name: "", code: "", phone_code: "", status: "active" },
  });

  useEffect(() => {
    if (country) {
      form.reset({
        name: country.name,
        code: country.code ?? "",
        phone_code: country.phone_code ?? "",
        status: (country.status as "active" | "inactive") ?? "active",
      });
    }
  }, [country, form]);

  return (
    <EntityFormPage
      backTo="/organisation/countries"
      backLabel="Back to countries"
      title={country ? `Edit ${country.name}` : "Edit country"}
      description="Update country details."
      formId="country-form"
      submitLabel="Save changes"
      isPending={update.isPending}
      cancelTo="/organisation/countries"
    >
      {show.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : (
        <form
          id="country-form"
          onSubmit={form.handleSubmit((values) =>
            update.mutate(
              { id: countryId, input: values },
              { onSuccess: () => navigate({ to: "/organisation/countries" }) },
            ),
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
      )}
    </EntityFormPage>
  );
}