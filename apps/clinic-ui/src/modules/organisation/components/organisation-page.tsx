import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Globe, Mail, MapPin, ShieldCheck, Users, Settings } from "lucide-react";
import { AddressManager } from "@/modules/addresses/components/address-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  fetchOrganisation,
  fetchRoles,
  fetchUsers,
  updateOrganisation,
  type UpdateOrganisationInput,
} from "@/lib/api";

const emptyForm: UpdateOrganisationInput = {
  name: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  registrationNumber: "",
};

export function OrganisationPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UpdateOrganisationInput>(emptyForm);

  const { data: organisation, isLoading: orgLoading } = useQuery({
    queryKey: ["organisation"],
    queryFn: fetchOrganisation,
  });

  const { data: usersResponse } = useQuery({
    queryKey: ["users", "count"],
    queryFn: () => fetchUsers({ limit: 1 }),
  });

  const { data: rolesResponse } = useQuery({
    queryKey: ["roles", "count"],
    queryFn: () => fetchRoles({ limit: 1 }),
  });

  const stats = [
    { label: "Total Users", value: usersResponse?.meta?.total ?? "—", icon: Users },
    { label: "Active Roles", value: rolesResponse?.meta?.total ?? "—", icon: ShieldCheck },
  ];

  useEffect(() => {
    if (organisation) {
      setForm({
        name: organisation.name,
        address: organisation.address ?? "",
        phone: organisation.phone ?? "",
        email: organisation.email ?? "",
        website: organisation.website ?? "",
        registrationNumber: organisation.registrationNumber ?? "",
      });
    }
  }, [organisation]);

  const saveMutation = useMutation({
    mutationFn: (input: UpdateOrganisationInput) => updateOrganisation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organisation"] });
      setEditing(false);
      toast.success("Organisation updated successfully");
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  function startEditing() {
    if (organisation) {
      setForm({
        name: organisation.name,
        address: organisation.address ?? "",
        phone: organisation.phone ?? "",
        email: organisation.email ?? "",
        website: organisation.website ?? "",
        registrationNumber: organisation.registrationNumber ?? "",
      });
    } else {
      setForm(emptyForm);
    }
    setEditing(true);
  }

  function handleSave() {
    saveMutation.mutate(form);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Organisation</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your clinic's settings, users, and permissions</p>
        </div>
        {!editing && (
          <Button variant="outline" onClick={startEditing}>
            <Settings className="mr-2 size-4" />
            {organisation ? "Edit Profile" : "Set Up Organisation"}
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-none bg-primary/10">
                <Icon className="size-5 text-primary" />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-xl font-semibold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4" />
              Organisation Details
            </CardTitle>
            <CardDescription>Key information about your clinic</CardDescription>
          </CardHeader>
          <CardContent>
            {orgLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : editing ? (
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="org-name">Clinic Name *</FieldLabel>
                  <Input id="org-name" placeholder="My Clinic" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="org-address">Address</FieldLabel>
                  <Input id="org-address" placeholder="123 Healthcare Blvd, Medical District" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="org-phone">Phone</FieldLabel>
                  <Input id="org-phone" placeholder="+1 (555) 123-4567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="org-email">Email</FieldLabel>
                  <Input id="org-email" type="email" placeholder="admin@clinic.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="org-website">Website</FieldLabel>
                  <Input id="org-website" placeholder="www.clinic.com" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="org-reg">Registration No.</FieldLabel>
                  <Input id="org-reg" placeholder="MC-2024-00189" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} />
                </Field>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={!form.name?.trim() || saveMutation.isPending}>
                    Save
                  </Button>
                </div>
              </FieldGroup>
            ) : organisation ? (
              <dl className="space-y-3">
                {[
                  { label: "Clinic Name", value: organisation.name },
                  { label: "Address", value: organisation.address },
                  { label: "Phone", value: organisation.phone },
                  { label: "Email", value: organisation.email },
                  { label: "Website", value: organisation.website },
                  { label: "Registration No.", value: organisation.registrationNumber },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{value || <span className="text-muted-foreground">—</span>}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <p className="text-sm text-muted-foreground">Organisation profile not set up yet.</p>
                <Button onClick={startEditing}>Set Up Organisation</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Addresses card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-4" />
              Addresses
            </CardTitle>
            <CardDescription>Manage clinic addresses</CardDescription>
          </CardHeader>
          <CardContent>
            {organisation && <AddressManager addressableType="Organisation" addressableId={organisation.id} />}
            {!organisation && <p className="text-sm text-muted-foreground">Set up the organisation profile first.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Manage your organisation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: Users, label: "Manage Users", to: "/organisation/users" },
              { icon: ShieldCheck, label: "Roles & Permissions", to: "/organisation/roles" },
              { icon: Globe, label: "Clinic Profile & Branding", to: "/organisation" },
              { icon: Mail, label: "Email & Notification Settings", to: "/organisation" },
            ].map(({ icon: Icon, label, to }) => (
              <Button key={label} variant="outline" className="w-full justify-start gap-3" asChild>
                <Link to={to}>
                  <Icon className="size-4 text-muted-foreground" />
                  {label}
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
