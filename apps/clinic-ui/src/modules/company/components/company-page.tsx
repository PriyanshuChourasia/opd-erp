import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Globe, ImageUp, Mail, MapPin, ShieldCheck, Users, Settings, X } from "lucide-react";
import { AddressManager } from "@/modules/addresses/components/address-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  fetchCompany,
  fetchRoles,
  fetchUsers,
  updateCompany,
  uploadDocument,
  type DocumentRecord,
  type UpdateCompanyInput,
} from "@/lib/api";
import { useAppSelector } from "@/store/hooks";
import { hasPermission } from "@/lib/roles";

const emptyForm: UpdateCompanyInput = {
  name: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  registrationNumber: "",
  registrationFee: 100,
  discountEnabled: true,
  maxDiscountPercent: 50,
  defaultDiscountType: "percent",
  gstNumber: "",
  panNumber: "",
  drugLicenseNumber: "",
  drugLicenseExpiry: "",
  taxRegistrationNumber: "",
  logoUrl: "",
};

export function CompanyPage() {
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<UpdateCompanyInput>(emptyForm);
  const permissions = useAppSelector((state) => state.auth.user?.permissions);
  const canReadCompany = hasPermission(permissions, "read", "company");

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["company"],
    queryFn: fetchCompany,
    enabled: canReadCompany,
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

  function openSheet() {
    if (company) {
      setForm({
        name: company.name,
        address: company.address ?? "",
        phone: company.phone ?? "",
        email: company.email ?? "",
        website: company.website ?? "",
        registrationNumber: company.registrationNumber ?? "",
        registrationFee: company.registrationFee ?? 0,
        discountEnabled: company.discountEnabled,
        maxDiscountPercent: company.maxDiscountPercent,
        defaultDiscountType: company.defaultDiscountType,
        gstNumber: company.gstNumber ?? "",
        panNumber: company.panNumber ?? "",
        drugLicenseNumber: company.drugLicenseNumber ?? "",
        drugLicenseExpiry: company.drugLicenseExpiry ? company.drugLicenseExpiry.slice(0, 10) : "",
        taxRegistrationNumber: company.taxRegistrationNumber ?? "",
        logoUrl: company.logoUrl ?? "",
      });
    } else {
      setForm(emptyForm);
    }
    setSheetOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: (input: UpdateCompanyInput) => updateCompany(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company"] });
      setSheetOpen(false);
      toast.success("Company updated successfully");
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  function handleSave() {
    saveMutation.mutate(form);
  }

  const logoUploading = useMutation({
    mutationFn: (file: File) =>
      uploadDocument(file, "logo", "company", company?.id ?? "company", { isPrimary: true }),
    onSuccess: (doc: DocumentRecord) => {
      setForm((prev) => ({ ...prev, logoUrl: doc.fileName }));
      toast.success("Logo uploaded");
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  function handleLogoFile(file?: File | null) {
    if (file) logoUploading.mutate(file);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Company Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your clinic&apos;s settings, users, and permissions</p>
        </div>
        <Button variant="outline" onClick={openSheet}>
          <Settings className="mr-2 size-4" />
          {company ? "Edit Profile" : "Set Up Company"}
        </Button>
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
              Company Details
            </CardTitle>
            <CardDescription>Key information about your clinic</CardDescription>
          </CardHeader>
          <CardContent>
            {companyLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : company ? (
              <dl className="space-y-3">
                {[
                  { label: "Clinic Name", value: company.name },
                  { label: "Address", value: company.address },
                  { label: "Phone", value: company.phone },
                  { label: "Email", value: company.email },
                  { label: "Website", value: company.website },
                  { label: "Registration No.", value: company.registrationNumber },
                  { label: "Registration Fee", value: company.registrationFee ? `₹${company.registrationFee}` : null },
                  { label: "Discounts", value: company.discountEnabled ? `Enabled (max ${company.maxDiscountPercent}%)` : "Disabled" },
                  { label: "GST Number", value: company.gstNumber },
                  { label: "PAN Number", value: company.panNumber },
                  { label: "Drug License No.", value: company.drugLicenseNumber },
                  { label: "Drug License Expiry", value: company.drugLicenseExpiry ? new Date(company.drugLicenseExpiry).toLocaleDateString() : null },
                  { label: "Tax Registration No.", value: company.taxRegistrationNumber },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{value || <span className="text-muted-foreground">—</span>}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <p className="text-sm text-muted-foreground">Company profile not set up yet.</p>
                <Button onClick={openSheet}>Set Up Company</Button>
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
            {company && <AddressManager addressableType="Organisation" addressableId={company.id} />}
            {!company && <p className="text-sm text-muted-foreground">Set up the company profile first.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Manage your company</CardDescription>
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{company ? "Edit Company" : "Set Up Company"}</SheetTitle>
            <SheetDescription>Update your clinic&apos;s profile information.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 px-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Clinic Logo</FieldLabel>
                <div className="flex items-center gap-3">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                    {form.logoUrl ? (
                      <img src={`/uploads/documents/${form.logoUrl}`} alt="Clinic logo" className="size-full object-contain" />
                    ) : (
                      <Building2 className="size-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border px-3 py-1.5 text-sm font-medium hover:bg-muted">
                      <ImageUp className="size-4" />
                      {logoUploading.isPending ? "Uploading…" : "Upload logo"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={logoUploading.isPending}
                        onChange={(e) => handleLogoFile(e.target.files?.[0])}
                      />
                    </label>
                    {form.logoUrl && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => setForm((prev) => ({ ...prev, logoUrl: "" }))}
                      >
                        <X className="size-3" /> Remove logo
                      </button>
                    )}
                  </div>
                </div>
              </Field>
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
              <Field>
                <FieldLabel htmlFor="org-reg-fee">Registration Fee (₹)</FieldLabel>
                <Input
                  id="org-reg-fee"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.registrationFee ?? 0}
                  onChange={(e) => setForm({ ...form, registrationFee: Number(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">Charged once per patient, on their first-ever appointment at this clinic.</p>
              </Field>
            </FieldGroup>

            <div className="border-t pt-4">
              <h3 className="mb-3 text-sm font-semibold">Discount Settings</h3>
              <FieldGroup>
                <Field>
                  <label className="flex items-center gap-3 rounded-none border px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={form.discountEnabled ?? true}
                      onChange={(e) => setForm({ ...form, discountEnabled: e.target.checked })}
                    />
                    <div>
                      <span className="text-sm font-medium">Enable Discounts</span>
                      <p className="text-xs text-muted-foreground">Allow discount to be applied during billing and checkout</p>
                    </div>
                  </label>
                </Field>
                {form.discountEnabled && (
                  <>
                    <Field>
                      <FieldLabel htmlFor="org-max-disc">Max Discount (%)</FieldLabel>
                      <Input
                        id="org-max-disc"
                        type="number"
                        min={0}
                        max={100}
                        placeholder="50"
                        value={form.maxDiscountPercent ?? 50}
                        onChange={(e) => setForm({ ...form, maxDiscountPercent: Number(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground">Maximum discount percentage allowed per bill</p>
                    </Field>
                    <Field>
                      <FieldLabel>Default Discount Type</FieldLabel>
                      <div className="flex gap-2">
                        {[
                          { value: "percent", label: "Percentage (%)" },
                          { value: "flat", label: "Fixed (₹)" },
                        ].map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setForm({ ...form, defaultDiscountType: value })}
                            className={`flex-1 rounded-none border px-3 py-2 text-sm font-medium transition-colors ${
                              form.defaultDiscountType === value
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-input text-muted-foreground hover:border-primary/50"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </Field>
                  </>
                )}
              </FieldGroup>
            </div>

            <div className="border-t pt-4">
              <h3 className="mb-3 text-sm font-semibold">Tax & Compliance</h3>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="org-gst">GST Number</FieldLabel>
                  <Input id="org-gst" placeholder="22AAAAA0000A1Z5" value={form.gstNumber ?? ""} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="org-pan">PAN Number</FieldLabel>
                  <Input id="org-pan" placeholder="AAAAA0000A" value={form.panNumber ?? ""} onChange={(e) => setForm({ ...form, panNumber: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="org-drug-license">Drug License Number</FieldLabel>
                  <Input id="org-drug-license" placeholder="20B-MH-12345" value={form.drugLicenseNumber ?? ""} onChange={(e) => setForm({ ...form, drugLicenseNumber: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="org-drug-expiry">Drug License Expiry</FieldLabel>
                  <Input id="org-drug-expiry" type="date" value={form.drugLicenseExpiry ?? ""} onChange={(e) => setForm({ ...form, drugLicenseExpiry: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="org-tax-reg">Tax Registration Number</FieldLabel>
                  <Input id="org-tax-reg" placeholder="Tax registration number" value={form.taxRegistrationNumber ?? ""} onChange={(e) => setForm({ ...form, taxRegistrationNumber: e.target.value })} />
                </Field>
              </FieldGroup>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name?.trim() || saveMutation.isPending}>
              Save
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
