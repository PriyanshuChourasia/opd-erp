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
  useShowOrganization,
  useUpdateOrganization,
} from "@/features/organizations/hooks";
import { organizationFormSchema } from "@/features/organizations/schema";

export const Route = createFileRoute(
  "/_admin/organisation/organizations/$organizationId/edit",
)({
  component: EditOrganizationPage,
});

function EditOrganizationPage() {
  const { organizationId } = Route.useParams();
  const navigate = useNavigate();
  const show = useShowOrganization(organizationId);
  const update = useUpdateOrganization();
  const org = show.data;

  const form = useForm({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: "",
      legal_name: "",
      registration_number: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
      timezone: "UTC",
      locale: "en",
      currency: "USD",
      status: "active",
    },
  });

  useEffect(() => {
    if (org) {
      form.reset({
        name: org.name,
        legal_name: org.legal_name ?? "",
        registration_number: org.registration_number ?? "",
        email: org.email ?? "",
        phone: org.phone ?? "",
        address: org.address ?? "",
        city: org.city ?? "",
        state: org.state ?? "",
        country: org.country ?? "",
        pincode: org.pincode ?? "",
        timezone: org.timezone ?? "UTC",
        locale: org.locale ?? "en",
        currency: org.currency ?? "USD",
        status: (org.status as "active" | "inactive") ?? "active",
      });
    }
  }, [org, form]);

  return (
    <EntityFormPage
      backTo="/organisation/organizations"
      backLabel="Back to organizations"
      title={org ? `Edit ${org.name}` : "Edit organization"}
      description="Update organization details."
      formId="organization-form"
      submitLabel="Save changes"
      isPending={update.isPending}
      cancelTo="/organisation/organizations"
    >
      {show.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : (
        <form
          id="organization-form"
          onSubmit={form.handleSubmit((values) =>
            update.mutate(
              {
                id: organizationId,
                input: {
                  name: values.name,
                  legal_name: values.legal_name || null,
                  registration_number: values.registration_number || null,
                  email: values.email || null,
                  phone: values.phone || null,
                  address: values.address || null,
                  city: values.city || null,
                  state: values.state || null,
                  country: values.country || null,
                  pincode: values.pincode || null,
                  timezone: values.timezone || null,
                  locale: values.locale || null,
                  currency: values.currency || null,
                  status: values.status,
                },
              },
              { onSuccess: () => navigate({ to: "/organisation/organizations" }) },
            ),
          )}
          className="flex flex-col gap-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="name">Organization name *</FieldLabel>
              <Input id="name" placeholder="e.g. Acme Clinics" {...form.register("name")} />
              <FieldError errors={form.formState.errors.name ? [form.formState.errors.name] : undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="legal_name">Legal name</FieldLabel>
              <Input id="legal_name" placeholder="e.g. Acme Clinics LLC" {...form.register("legal_name")} />
              <FieldError errors={form.formState.errors.legal_name ? [form.formState.errors.legal_name] : undefined} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="registration_number">Registration number</FieldLabel>
              <Input id="registration_number" placeholder="e.g. TIN/GST" {...form.register("registration_number")} />
              <FieldError errors={form.formState.errors.registration_number ? [form.formState.errors.registration_number] : undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" placeholder="org@example.com" {...form.register("email")} />
              <FieldError errors={form.formState.errors.email ? [form.formState.errors.email] : undefined} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="phone">Phone</FieldLabel>
            <Input id="phone" placeholder="+1-555-0100" {...form.register("phone")} />
            <FieldError errors={form.formState.errors.phone ? [form.formState.errors.phone] : undefined} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="address">Address</FieldLabel>
              <Input id="address" placeholder="Street" {...form.register("address")} />
              <FieldError errors={form.formState.errors.address ? [form.formState.errors.address] : undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="city">City</FieldLabel>
              <Input id="city" placeholder="City" {...form.register("city")} />
              <FieldError errors={form.formState.errors.city ? [form.formState.errors.city] : undefined} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="state">State</FieldLabel>
              <Input id="state" placeholder="State" {...form.register("state")} />
              <FieldError errors={form.formState.errors.state ? [form.formState.errors.state] : undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="country">Country</FieldLabel>
              <Input id="country" placeholder="Country" {...form.register("country")} />
              <FieldError errors={form.formState.errors.country ? [form.formState.errors.country] : undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="pincode">Pincode</FieldLabel>
              <Input id="pincode" placeholder="Postal code" {...form.register("pincode")} />
              <FieldError errors={form.formState.errors.pincode ? [form.formState.errors.pincode] : undefined} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
              <Input id="timezone" placeholder="e.g. UTC" {...form.register("timezone")} />
              <FieldError errors={form.formState.errors.timezone ? [form.formState.errors.timezone] : undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="locale">Locale</FieldLabel>
              <Input id="locale" placeholder="e.g. en" {...form.register("locale")} />
              <FieldError errors={form.formState.errors.locale ? [form.formState.errors.locale] : undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="currency">Currency</FieldLabel>
              <Input id="currency" placeholder="e.g. USD" {...form.register("currency")} />
              <FieldError errors={form.formState.errors.currency ? [form.formState.errors.currency] : undefined} />
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
