import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Home, Building2, Receipt, MapPin, Plus, Pencil, Trash2, Star, X, Check } from "lucide-react";
import {
  fetchEntityAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setPrimaryAddress,
  type Address,
  type CreateAddressInput,
  type UpdateAddressInput,
  ADDRESS_TYPES,
} from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ADDRESS_TYPE_ICONS: Record<string, typeof Home> = {
  CLINIC: Building2,
  HOME: Home,
  BILLING: Receipt,
  OTHER: MapPin,
};

interface AddressManagerProps {
  addressableType: string;
  addressableId: string;
}

function emptyAddressForm(addressableType: string, addressableId: string): CreateAddressInput {
  return {
    addressType: "CLINIC",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "",
    district: "",
    state: "",
    country: "India",
    postalCode: "",
    addressableType,
    addressableId,
    isPrimary: false,
  };
}

export function AddressManager({ addressableType, addressableId }: AddressManagerProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState<CreateAddressInput | UpdateAddressInput>(emptyAddressForm(addressableType, addressableId));

  const queryKey = ["addresses", addressableType, addressableId];
  const { data: addresses = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchEntityAddresses(addressableType, addressableId),
    enabled: !!addressableId,
  });

  const createMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); cancelForm(); toast.success("Address added successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAddressInput }) => updateAddress(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); cancelForm(); toast.success("Address updated successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); setDeleteConfirm(null); toast.success("Address deleted"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });
  const primaryMutation = useMutation({
    mutationFn: setPrimaryAddress,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); toast.success("Primary address updated"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  function cancelForm() { setShowForm(false); setEditingId(null); setForm(emptyAddressForm(addressableType, addressableId)); }

  function startAdd() {
    setEditingId(null);
    setForm(emptyAddressForm(addressableType, addressableId));
    setShowForm(true);
  }

  function startEdit(address: Address) {
    setEditingId(address.id);
    setForm({
      addressType: address.addressType,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? "",
      landmark: address.landmark ?? "",
      city: address.city ?? "",
      district: address.district ?? "",
      state: address.state ?? "",
      country: address.country ?? "India",
      postalCode: address.postalCode ?? "",
      latitude: address.latitude ?? undefined,
      longitude: address.longitude ?? undefined,
      isPrimary: address.isPrimary,
    });
    setShowForm(true);
  }

  function handleSave() {
    if (!(form as CreateAddressInput).addressLine1?.trim()) return;
    if (editingId) updateMutation.mutate({ id: editingId, data: form as UpdateAddressInput });
    else createMutation.mutate(form as CreateAddressInput);
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <MapPin className="size-4 text-muted-foreground" />
          Addresses
        </h4>
        {!showForm && (
          <Button variant="outline" size="sm" onClick={startAdd}>
            <Plus className="mr-1 size-3.5" />Add Address
          </Button>
        )}
      </div>

      {isLoading && <p className="text-xs text-muted-foreground py-2">Loading addresses...</p>}

      {/* Address list */}
      {!showForm && addresses.length > 0 && (
        <div className="space-y-2">
          {addresses.map((address) => {
            const TypeIcon = ADDRESS_TYPE_ICONS[address.addressType] ?? MapPin;
            const isEditing = editingId === address.id;
            return (
              <div key={address.id} className={`flex items-start gap-3 rounded-none border p-3 ${address.isPrimary ? 'border-primary/30 bg-primary/5' : ''}`}>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <TypeIcon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium capitalize">{address.addressType.toLowerCase()}</p>
                    {address.isPrimary && <Badge variant="default" className="text-[9px] h-4 bg-primary/10 text-primary border-primary/20"><Star className="mr-0.5 size-2.5" />Primary</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}</p>
                  <p className="text-xs text-muted-foreground">{[address.city, address.district, address.state, address.postalCode].filter(Boolean).join(', ')}</p>
                  {address.landmark && <p className="text-xs text-muted-foreground">Near: {address.landmark}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  {!address.isPrimary && (
                    <Button variant="ghost" size="icon" className="size-7" title="Set as primary" onClick={() => primaryMutation.mutate(address.id)}>
                      <Star className="size-3 text-muted-foreground" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="size-7" title="Edit" onClick={() => startEdit(address)}>
                    <Pencil className="size-3" />
                  </Button>
                  {deleteConfirm === address.id ? (
                    <div className="flex items-center gap-0.5">
                      <Button variant="destructive" size="icon-sm" className="size-7" onClick={() => deleteMutation.mutate(address.id)}><Check className="size-3" /></Button>
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => setDeleteConfirm(null)}><X className="size-3" /></Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => setDeleteConfirm(address.id)}>
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!showForm && addresses.length === 0 && !isLoading && (
        <p className="py-4 text-center text-xs text-muted-foreground">No addresses added yet.</p>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <div className="rounded-none border p-3 space-y-3">
          <FieldGroup>
            <Field><FieldLabel>Address Type</FieldLabel>
              <Select
                value={(form as CreateAddressInput).addressType}
                onValueChange={(v) => setForm({ ...form, addressType: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ADDRESS_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field><FieldLabel htmlFor="addr-line1">Address Line 1 *</FieldLabel>
              <Input id="addr-line1" placeholder="123 Main Street" value={(form as CreateAddressInput).addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} />
            </Field>
            <Field><FieldLabel htmlFor="addr-line2">Address Line 2</FieldLabel>
              <Input id="addr-line2" placeholder="Suite 100" value={form.addressLine2 ?? ""} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} />
            </Field>
            <Field><FieldLabel htmlFor="addr-landmark">Landmark</FieldLabel>
              <Input id="addr-landmark" placeholder="Near City Hospital" value={form.landmark ?? ""} onChange={(e) => setForm({ ...form, landmark: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field><FieldLabel htmlFor="addr-city">City</FieldLabel>
                <Input id="addr-city" placeholder="Mumbai" value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </Field>
              <Field><FieldLabel htmlFor="addr-district">District</FieldLabel>
                <Input id="addr-district" placeholder="Mumbai City" value={form.district ?? ""} onChange={(e) => setForm({ ...form, district: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field><FieldLabel htmlFor="addr-state">State</FieldLabel>
                <Input id="addr-state" placeholder="Maharashtra" value={form.state ?? ""} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </Field>
              <Field><FieldLabel htmlFor="addr-country">Country</FieldLabel>
                <Input id="addr-country" placeholder="India" value={form.country ?? "India"} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </Field>
            </div>
            <Field><FieldLabel htmlFor="addr-pincode">Postal Code</FieldLabel>
              <Input id="addr-pincode" placeholder="400001" value={form.postalCode ?? ""} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field><FieldLabel htmlFor="addr-lat">Latitude</FieldLabel>
                <Input id="addr-lat" type="number" step="any" placeholder="19.0760" value={form.latitude ?? ""} onChange={(e) => setForm({ ...form, latitude: e.target.value ? Number(e.target.value) : undefined })} />
              </Field>
              <Field><FieldLabel htmlFor="addr-lng">Longitude</FieldLabel>
                <Input id="addr-lng" type="number" step="any" placeholder="72.8777" value={form.longitude ?? ""} onChange={(e) => setForm({ ...form, longitude: e.target.value ? Number(e.target.value) : undefined })} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-primary" checked={form.isPrimary ?? false} onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })} />
              Set as primary address
            </label>
          </FieldGroup>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={cancelForm}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!(form as CreateAddressInput).addressLine1?.trim() || isPending}>
              {editingId ? "Save" : "Add Address"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
