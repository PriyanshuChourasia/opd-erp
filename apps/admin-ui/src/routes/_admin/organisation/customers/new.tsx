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
import { useCreateCustomer } from "@/features/customers/hooks";
import { customerFormSchema } from "@/features/customers/schema";
import { useUsers } from "@/features/users/hooks";

export const Route = createFileRoute("/_admin/organisation/customers/new")({
  component: NewCustomerPage,
});

const NONE = "__none__";

function NewCustomerPage() {
  const navigate = useNavigate();
  const users = useUsers({ page: 1, limit: 100, search: "" });
  const create = useCreateCustomer();
  const form = useForm({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      gender: "",
      date_of_birth: "",
      address: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
      status: "active",
      user_id: NONE,
    },
  });

  return (
    <EntityFormPage
      backTo="/organisation/customers"
      backLabel="Back to customers"
      title="Add customer"
      description="Customer profile and contact details."
      formId="customer-form"
      submitLabel="Create customer"
      isPending={create.isPending}
      cancelTo="/organisation/customers"
    >
      <form
        id="customer-form"
        onSubmit={form.handleSubmit((values) =>
          create.mutate(
            {
              first_name: values.first_name,
              last_name: values.last_name || null,
              email: values.email,
              phone: values.phone || null,
              gender: values.gender || null,
              date_of_birth: values.date_of_birth || null,
              address: values.address || null,
              city: values.city || null,
              state: values.state || null,
              country: values.country || null,
              pincode: values.pincode || null,
              status: values.status,
              user_id: values.user_id === NONE ? null : Number(values.user_id),
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
    </EntityFormPage>
  );
}