import { createFileRoute } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from "@/features/customers/hooks";
import type { Customer } from "@/features/customers/interface";
import { customerFormSchema, type CustomerFormValues } from "@/features/customers/schema";
import { useUsers } from "@/features/users/hooks";
import type { User } from "@/features/users/interface";
import { StatusBadge } from "./departments";

export const Route = createFileRoute("/_admin/organisation/customers")({
  component: CustomersPage,
});

const PAGE_SIZE = 8;
const NONE = "__none__";

function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<
    { mode: "create" } | { mode: "edit"; customer: Customer } | null
  >(null);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const list = useCustomers({ page, limit: PAGE_SIZE, search: query });
  const users = useUsers({ page: 1, limit: 100, search: "" });
  const create = useCreateCustomer();
  const update = useUpdateCustomer();
  const remove = useDeleteCustomer();

  const rows = list.data?.data ?? [];
  const meta = list.data?.meta;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Your customer directory and contact details.
          </p>
        </div>
        <Button onClick={() => setDialog({ mode: "create" })}>
          <Plus /> Add customer
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setQuery(search);
              }}
              placeholder="Search by name, email or phone…"
              className="pl-9"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.isPending ? (
                  <TableRow><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No customers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        {c.first_name} {c.last_name || ""}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.email}</TableCell>
                      <TableCell>{c.phone || "—"}</TableCell>
                      <TableCell>{c.city || "—"}</TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <span className="sr-only">Actions</span>
                              <span className="text-muted-foreground">···</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{c.first_name} {c.last_name || ""}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDialog({ mode: "edit", customer: c })}>
                              <Pencil /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              disabled={remove.isPending}
                              onClick={() => {
                                if (!window.confirm(`Delete customer "${c.first_name} ${c.last_name || ""}"?`)) return;
                                remove.mutate(c.id);
                              }}
                            >
                              <Trash2 /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-end gap-3">
              <Button size="sm" variant="outline" disabled={page <= 1 || list.isPending} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {meta.page} of {meta.totalPages}
              </span>
              <Button size="sm" variant="outline" disabled={page >= meta.totalPages || list.isPending} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {dialog && (
        <CustomerDialog
          open
          mode={dialog.mode}
          customer={dialog.mode === "edit" ? dialog.customer : undefined}
          userOptions={users.data?.data ?? []}
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          isPending={create.isPending || update.isPending}
          onSubmit={(values) => {
            const input = {
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
            };
            if (dialog.mode === "create") {
              create.mutate(input, { onSuccess: () => setDialog(null) });
            } else {
              update.mutate(
                { id: dialog.customer.id, input },
                { onSuccess: () => setDialog(null) },
              );
            }
          }}
        />
      )}
    </div>
  );
}

function CustomerDialog({
  open,
  mode,
  customer,
  userOptions,
  onOpenChange,
  isPending,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  customer?: Customer;
  userOptions: User[];
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onSubmit: (values: CustomerFormValues) => void;
}) {
  const form = useForm({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      first_name: customer?.first_name ?? "",
      last_name: customer?.last_name ?? "",
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
      gender: customer?.gender ?? "",
      date_of_birth: customer?.date_of_birth ?? "",
      address: customer?.address ?? "",
      city: customer?.city ?? "",
      state: customer?.state ?? "",
      country: customer?.country ?? "",
      pincode: customer?.pincode ?? "",
      status: (customer?.status as "active" | "inactive") ?? "active",
      user_id: customer?.user_id ? String(customer.user_id) : NONE,
    },
  });

  useEffect(() => {
    form.reset({
      first_name: customer?.first_name ?? "",
      last_name: customer?.last_name ?? "",
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
      gender: customer?.gender ?? "",
      date_of_birth: customer?.date_of_birth ?? "",
      address: customer?.address ?? "",
      city: customer?.city ?? "",
      state: customer?.state ?? "",
      country: customer?.country ?? "",
      pincode: customer?.pincode ?? "",
      status: (customer?.status as "active" | "inactive") ?? "active",
      user_id: customer?.user_id ? String(customer.user_id) : NONE,
    });
  }, [customer, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add customer" : `Edit ${customer?.first_name ?? "customer"}`}
          </DialogTitle>
          <DialogDescription>Customer contact and location details.</DialogDescription>
        </DialogHeader>
        <form
          id="customer-form"
          onSubmit={form.handleSubmit(onSubmit)}
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
            <Textarea id="address" rows={2} {...form.register("address")} />
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
            <Field>
              <FieldLabel htmlFor="country">Country</FieldLabel>
              <Input id="country" {...form.register("country")} />
              <FieldError errors={form.formState.errors.country ? [form.formState.errors.country] : undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="pincode">Pin code</FieldLabel>
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
                    {userOptions.map((u) => (
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
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="customer-form" disabled={isPending}>
            {mode === "create" ? "Create customer" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}