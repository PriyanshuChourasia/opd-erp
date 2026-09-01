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
  useShowCustomer,
  useUpdateCustomer,
} from "@/features/customers/hooks";
import { customerFormSchema } from "@/features/customers/schema";
import { useUsers } from "@/features/users/hooks";

export const Route = createFileRoute("/_admin/organisation/customers/$customerId/edit")({
  component: EditCustomerPage,
});

const NONE = "__none__";

function EditCustomerPage() {
  const { customerId } = Route.useParams();
  const navigate = useNavigate();
  const users = useUsers({ page: 1, limit: 100, search: "" });
  const show = useShowCustomer(customerId);
  const update = useUpdateCustomer();
  const customer = show.data;

  const form = useForm({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      company_name: "",
      tax_number: "",
      email: "",
      phone: "",
      gender: "",
      date_of_birth: "",
      address: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
      billing_address: "",
      billing_city: "",
      billing_state: "",
      billing_country: "",
      billing_pincode: "",
      status: "active",
      user_id: NONE,
    },
  });

  useEffect(() => {
    if (customer) {
      form.reset({
        first_name: customer.first_name,
        last_name: customer.last_name ?? "",
        company_name: customer.company_name ?? "",
        tax_number: customer.tax_number ?? "",
        email: customer.email,
        phone: customer.phone ?? "",
        gender: customer.gender ?? "",
        date_of_birth: customer.date_of_birth ?? "",
        address: customer.address ?? "",
        city: customer.city ?? "",
        state: customer.state ?? "",
        country: customer.country ?? "",
        pincode: customer.pincode ?? "",
        billing_address: customer.billing_address ?? "",
        billing_city: customer.billing_city ?? "",
        billing_state: customer.billing_state ?? "",
        billing_country: customer.billing_country ?? "",
        billing_pincode: customer.billing_pincode ?? "",
        status: (customer.status as "active" | "inactive") ?? "active",
        user_id: customer.user_id ? String(customer.user_id) : NONE,
      });
    }
  }, [customer, form]);

  return (
    <EntityFormPage
      backTo="/organisation/customers"
      backLabel="Back to customers"
      title={customer ? `Edit ${customer.first_name} ${customer.last_name ?? ""}` : "Edit customer"}
      description="Update customer details."
      formId="customer-form"
      submitLabel="Save changes"
      isPending={update.isPending}
      cancelTo="/organisation/customers"
    >
      {show.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : (
        <form
          id="customer-form"
          onSubmit={form.handleSubmit((values) =>
            update.mutate(
              {
                id: customerId,
                input: {
                  first_name: values.first_name,
                  last_name: values.last_name || null,
                  company_name: values.company_name || null,
                  tax_number: values.tax_number || null,
                  email: values.email,
                  phone: values.phone || null,
                  gender: values.gender || null,
                  date_of_birth: values.date_of_birth || null,
                  address: values.address || null,
                  city: values.city || null,
                  state: values.state || null,
                  country: values.country || null,
                  pincode: values.pincode || null,
                  billing_address: values.billing_address || null,
                  billing_city: values.billing_city || null,
                  billing_state: values.billing_state || null,
                  billing_country: values.billing_country || null,
                  billing_pincode: values.billing_pincode || null,
                  status: values.status,
                  user_id: values.user_id === NONE ? null : Number(values.user_id),
                },
              },
              { onSuccess: () => navigate({ to: "/organisation/customers" }) },
            ),
          )}
          className="flex flex-col gap-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="first_name">First name *</FieldLabel>
              <Input id="first_name" {...form.register("first_name")} />
              <FieldError errors={form.formState.errors.first_name ? [form.formState.errors.first_name] : undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="last_name">Last name</FieldLabel>
              <Input id="last_name" {...form.register("last_name")} />
              <FieldError errors={form.formState.errors.last_name ? [form.formState.errors.last_name] : undefined} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="company_name">Company name</FieldLabel>
              <Input id="company_name" placeholder="Purchasing company" {...form.register("company_name")} />
              <FieldError errors={form.formState.errors.company_name ? [form.formState.errors.company_name] : undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="tax_number">Tax / Registration number</FieldLabel>
              <Input id="tax_number" {...form.register("tax_number")} />
              <FieldError errors={form.formState.errors.tax_number ? [form.formState.errors.tax_number] : undefined} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="email">Email *</FieldLabel>
              <Input id="email" type="email" autoComplete="off" {...form.register("email")} />
              <FieldError errors={form.formState.errors.email ? [form.formState.errors.email] : undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="phone">Phone</FieldLabel>
              <Input id="phone" type="tel" {...form.register("phone")} />
              <FieldError errors={form.formState.errors.phone ? [form.formState.errors.phone] : undefined} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Gender</FieldLabel>
              <Controller
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={form.formState.errors.gender ? [form.formState.errors.gender] : undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="date_of_birth">Date of birth</FieldLabel>
              <Input id="date_of_birth" type="date" {...form.register("date_of_birth")} />
              <FieldError errors={form.formState.errors.date_of_birth ? [form.formState.errors.date_of_birth] : undefined} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="address">Address</FieldLabel>
            <Input id="address" {...form.register("address")} />
            <FieldError errors={form.formState.errors.address ? [form.formState.errors.address] : undefined} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="city">City</FieldLabel>
              <Input id="city" {...form.register("city")} />
              <FieldError errors={form.formState.errors.city ? [form.formState.errors.city] : undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="state">State</FieldLabel>
              <Input id="state" {...form.register("state")} />
              <FieldError errors={form.formState.errors.state ? [form.formState.errors.state] : undefined} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="country">Country</FieldLabel>
              <Input id="country" {...form.register("country")} />
              <FieldError errors={form.formState.errors.country ? [form.formState.errors.country] : undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="pincode">Pincode</FieldLabel>
              <Input id="pincode" {...form.register("pincode")} />
              <FieldError errors={form.formState.errors.pincode ? [form.formState.errors.pincode] : undefined} />
            </Field>
          </div>
          <div className="mt-2 text-sm font-semibold text-muted-foreground">Billing details</div>
          <Field>
            <FieldLabel htmlFor="billing_address">Billing address</FieldLabel>
            <Input id="billing_address" {...form.register("billing_address")} />
            <FieldError errors={form.formState.errors.billing_address ? [form.formState.errors.billing_address] : undefined} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="billing_city">City</FieldLabel>
              <Input id="billing_city" {...form.register("billing_city")} />
              <FieldError errors={form.formState.errors.billing_city ? [form.formState.errors.billing_city] : undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="billing_state">State</FieldLabel>
              <Input id="billing_state" {...form.register("billing_state")} />
              <FieldError errors={form.formState.errors.billing_state ? [form.formState.errors.billing_state] : undefined} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="billing_country">Country</FieldLabel>
              <Input id="billing_country" {...form.register("billing_country")} />
              <FieldError errors={form.formState.errors.billing_country ? [form.formState.errors.billing_country] : undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="billing_pincode">Pincode</FieldLabel>
              <Input id="billing_pincode" {...form.register("billing_pincode")} />
              <FieldError errors={form.formState.errors.billing_pincode ? [form.formState.errors.billing_pincode] : undefined} />
            </Field>
          </div>
          <Field>
            <FieldLabel>Link to login account</FieldLabel>
            <Controller
              control={form.control}
              name="user_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>No login account</SelectItem>
                    {(users.data?.data ?? []).map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={form.formState.errors.user_id ? [form.formState.errors.user_id] : undefined} />
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