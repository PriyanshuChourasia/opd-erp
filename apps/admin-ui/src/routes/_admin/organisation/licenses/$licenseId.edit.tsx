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
import { useCustomers } from "@/features/customers/hooks";
import { useShowLicense, useUpdateLicense } from "@/features/licenses/hooks";
import { licenseFormSchema } from "@/features/licenses/schema";
import { useOrganizations } from "@/features/organizations/hooks";

export const Route = createFileRoute("/_admin/organisation/licenses/$licenseId/edit")({
  component: EditLicensePage,
});

const statusLabel: Record<string, string> = {
  created: "Created",
  active: "Active",
  suspended: "Suspended",
  expired: "Expired",
  revoked: "Revoked",
};

const customerName = (c: {
  first_name: string;
  last_name?: string | null;
  company_name?: string | null;
}) => c.company_name || `${c.first_name} ${c.last_name ?? ""}`.trim();

function EditLicensePage() {
  const { licenseId } = Route.useParams();
  const navigate = useNavigate();
  const customers = useCustomers({ page: 1, limit: 100, search: "" });
  const organizations = useOrganizations({ page: 1, limit: 100, search: "" });
  const show = useShowLicense(licenseId);
  const update = useUpdateLicense();
  const license = show.data;

  const form = useForm({
    resolver: zodResolver(licenseFormSchema),
    defaultValues: {
      customer_id: "",
      organization_id: "__none__",
      status: "created",
      issue_date: "",
      start_date: "",
      expiry_date: "",
      plan: "",
      max_users: "",
      max_devices: "",
      features: "",
    },
  });

  useEffect(() => {
    if (license) {
      form.reset({
        customer_id: String(license.customer_id ?? ""),
        organization_id: license.organization_id
          ? String(license.organization_id)
          : "__none__",
        status: license.status as "created" | "active" | "suspended" | "expired" | "revoked",
        issue_date: license.issue_date ?? "",
        start_date: license.start_date ?? "",
        expiry_date: license.expiry_date ?? "",
        plan: license.plan ?? "",
        max_users: license.max_users === null ? "" : String(license.max_users),
        max_devices: license.max_devices === null ? "" : String(license.max_devices),
        features: license.features?.join(", ") ?? "",
      });
    }
  }, [license, form]);

  return (
    <EntityFormPage
      backTo="/organisation/licenses"
      backLabel="Back to licenses"
      title={license ? `Edit ${license.license_number}` : "Edit license"}
      description="Update license entitlement details."
      formId="license-form"
      submitLabel="Save changes"
      isPending={update.isPending}
      cancelTo="/organisation/licenses"
    >
      {show.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : (
        <form
          id="license-form"
          onSubmit={form.handleSubmit((values) =>
            update.mutate(
              {
                id: licenseId,
                input: {
                  customer_id: Number(values.customer_id),
                  organization_id:
                    values.organization_id === "__none__"
                      ? null
                      : Number(values.organization_id),
                  status: values.status,
                  issue_date: values.issue_date || null,
                  start_date: values.start_date || null,
                  expiry_date: values.expiry_date || null,
                  plan: values.plan || null,
                  max_users: values.max_users === "" ? null : Number(values.max_users),
                  max_devices: values.max_devices === "" ? null : Number(values.max_devices),
                  features:
                    values.features === ""
                      ? null
                      : values.features
                          .split(",")
                          .map((f) => f.trim())
                          .filter(Boolean),
                },
              },
              { onSuccess: () => navigate({ to: "/organisation/licenses" }) },
            ),
          )}
          className="flex flex-col gap-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Customer *</FieldLabel>
              <Controller
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent>
                      {(customers.data?.data ?? []).map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {customerName(c)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={form.formState.errors.customer_id ? [form.formState.errors.customer_id] : undefined} />
            </Field>
            <Field>
              <FieldLabel>Organization</FieldLabel>
              <Controller
                control={form.control}
                name="organization_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select organization" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Not assigned —</SelectItem>
                      {(organizations.data?.data ?? []).map((o) => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {o.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={form.formState.errors.organization_id ? [form.formState.errors.organization_id] : undefined} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabel).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={form.formState.errors.status ? [form.formState.errors.status] : undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="plan">Plan</FieldLabel>
              <Input id="plan" placeholder="e.g. enterprise" {...form.register("plan")} />
              <FieldError errors={form.formState.errors.plan ? [form.formState.errors.plan] : undefined} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="issue_date">Issue date</FieldLabel>
              <Input id="issue_date" type="date" {...form.register("issue_date")} />
              <FieldError errors={form.formState.errors.issue_date ? [form.formState.errors.issue_date] : undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="start_date">Start date</FieldLabel>
              <Input id="start_date" type="date" {...form.register("start_date")} />
              <FieldError errors={form.formState.errors.start_date ? [form.formState.errors.start_date] : undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="expiry_date">Expiry date</FieldLabel>
              <Input id="expiry_date" type="date" {...form.register("expiry_date")} />
              <FieldError errors={form.formState.errors.expiry_date ? [form.formState.errors.expiry_date] : undefined} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="max_users">Max users</FieldLabel>
              <Input id="max_users" type="number" min={0} {...form.register("max_users")} />
              <FieldError errors={form.formState.errors.max_users ? [form.formState.errors.max_users] : undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="max_devices">Max devices</FieldLabel>
              <Input id="max_devices" type="number" min={0} {...form.register("max_devices")} />
              <FieldError errors={form.formState.errors.max_devices ? [form.formState.errors.max_devices] : undefined} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="features">Features (comma separated)</FieldLabel>
            <Input id="features" placeholder="accounting, inventory, reports" {...form.register("features")} />
            <FieldError errors={form.formState.errors.features ? [form.formState.errors.features] : undefined} />
          </Field>
        </form>
      )}
    </EntityFormPage>
  );
}
