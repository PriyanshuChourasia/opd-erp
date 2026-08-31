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
import { useDepartments } from "@/features/departments/hooks";
import { useDesignations } from "@/features/designations/hooks";
import {
  useShowEmployee,
  useUpdateEmployee,
} from "@/features/employees/hooks";
import { employeeFormSchema } from "@/features/employees/schema";
import { useUsers } from "@/features/users/hooks";

export const Route = createFileRoute("/_admin/organisation/employees/$employeeId/edit")({
  component: EditEmployeePage,
});

const NONE = "__none__";

function EditEmployeePage() {
  const { employeeId } = Route.useParams();
  const navigate = useNavigate();
  const departments = useDepartments({ page: 1, limit: 100, search: "" });
  const designations = useDesignations({ page: 1, limit: 100, search: "" });
  const users = useUsers({ page: 1, limit: 100, search: "" });
  const show = useShowEmployee(employeeId);
  const update = useUpdateEmployee();
  const employee = show.data;

  const form = useForm({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      gender: "",
      date_of_joining: "",
      status: "active",
      department_id: "",
      designation_id: "",
      user_id: NONE,
    },
  });

  useEffect(() => {
    if (employee) {
      form.reset({
        first_name: employee.first_name,
        last_name: employee.last_name ?? "",
        email: employee.email,
        phone: employee.phone ?? "",
        gender: employee.gender ?? "",
        date_of_joining: employee.date_of_joining ?? "",
        status: (employee.status as "active" | "inactive") ?? "active",
        department_id: String(employee.department_id),
        designation_id: String(employee.designation_id),
        user_id: employee.user_id ? String(employee.user_id) : NONE,
      });
    }
  }, [employee, form]);

  return (
    <EntityFormPage
      backTo="/organisation/employees"
      backLabel="Back to employees"
      title={employee ? `Edit ${employee.first_name} ${employee.last_name ?? ""}` : "Edit employee"}
      description="Update staff profile details."
      formId="employee-form"
      submitLabel="Save changes"
      isPending={update.isPending}
      cancelTo="/organisation/employees"
    >
      {show.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : (
        <form
          id="employee-form"
          onSubmit={form.handleSubmit((values) =>
            update.mutate(
              {
                id: employeeId,
                input: {
                  first_name: values.first_name,
                  last_name: values.last_name || null,
                  email: values.email,
                  phone: values.phone || null,
                  gender: values.gender || null,
                  date_of_joining: values.date_of_joining || null,
                  status: values.status,
                  department_id: Number(values.department_id),
                  designation_id: Number(values.designation_id),
                  user_id: values.user_id === NONE ? null : Number(values.user_id),
                },
              },
              { onSuccess: () => navigate({ to: "/organisation/employees" }) },
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
              <FieldLabel htmlFor="date_of_joining">Date of joining</FieldLabel>
              <Input id="date_of_joining" type="date" {...form.register("date_of_joining")} />
              <FieldError errors={form.formState.errors.date_of_joining ? [form.formState.errors.date_of_joining] : undefined} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
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
            <Field>
              <FieldLabel>Designation *</FieldLabel>
              <Controller
                control={form.control}
                name="designation_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                    <SelectContent>
                      {(designations.data?.data ?? []).map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={form.formState.errors.designation_id ? [form.formState.errors.designation_id] : undefined} />
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