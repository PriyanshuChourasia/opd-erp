import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, Package, Calendar, FileText } from "lucide-react";
import {
  fetchMedicines,
  createPurchase,
  type Medicine,
  type PurchaseItemInput,
} from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function currency(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

interface CartRow {
  key: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  purchaseRate: number;
  mrp: number;
  batchNo: string;
  expiryDate: string;
}

function emptyRow(): CartRow {
  return {
    key: crypto.randomUUID(),
    medicineId: "",
    medicineName: "",
    quantity: 1,
    purchaseRate: 0,
    mrp: 0,
    batchNo: "",
    expiryDate: "",
  };
}

export function PurchaseEntryPage() {
  const queryClient = useQueryClient();
  const [supplierName, setSupplierName] = useState("");
  const [notes, setNotes] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [tax, setTax] = useState(0);
  const [cart, setCart] = useState<CartRow[]>([emptyRow()]);
  const [medicineQuery, setMedicineQuery] = useState("");
  const [activeRowKey, setActiveRowKey] = useState<string | null>(null);

  const medicineResults = useQuery({
    queryKey: ["pos-medicines", medicineQuery],
    queryFn: () => fetchMedicines({ search: medicineQuery, limit: 10 }),
    enabled: medicineQuery.trim().length >= 1,
  });

  const subtotal = useMemo(
    () =>
      cart.reduce((sum, row) => sum + row.quantity * row.purchaseRate, 0),
    [cart],
  );
  const total = subtotal + tax;

  const purchaseMutation = useMutation({
    mutationFn: () =>
      createPurchase({
        supplierName: supplierName || undefined,
        notes: notes || undefined,
        purchaseDate: purchaseDate || undefined,
        tax: tax || undefined,
        items: cart
          .filter((r) => r.medicineId && r.quantity > 0)
          .map((r) => ({
            medicineId: r.medicineId,
            quantity: r.quantity,
            purchaseRate: r.purchaseRate,
            mrp: r.mrp || undefined,
            batchNo: r.batchNo || undefined,
            expiryDate: r.expiryDate || undefined,
          })),
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      toast.success(
        `Purchase recorded — ${result.voucherNumber} (${result.itemCount} items, ${currency(result.totalAmount)})`,
      );
      setCart([emptyRow()]);
      setSupplierName("");
      setNotes("");
      setTax(0);
    },
    onError: (err) => {
      toast.error(extractApiError(err));
    },
  });

  function selectMedicine(medicine: Medicine, rowKey: string) {
    setCart((prev) =>
      prev.map((r) =>
        r.key === rowKey
          ? {
              ...r,
              medicineId: medicine.id,
              medicineName: [medicine.name, medicine.strength]
                .filter(Boolean)
                .join(" "),
              purchaseRate: medicine.price,
              mrp: medicine.price,
            }
          : r,
      ),
    );
    setMedicineQuery("");
    setActiveRowKey(null);
  }

  function updateRow(key: string, patch: Partial<CartRow>) {
    setCart((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  }

  function removeRow(key: string) {
    setCart((prev) => {
      if (prev.length <= 1) return [emptyRow()];
      return prev.filter((r) => r.key !== key);
    });
  }

  function addRow() {
    setCart((prev) => [...prev, emptyRow()]);
  }

  const isValid =
    cart.some((r) => r.medicineId && r.quantity > 0 && r.purchaseRate > 0) &&
    !purchaseMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Purchase Entry
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Record stock purchases from suppliers — creates a purchase voucher and
          updates inventory
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Purchase items */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Purchase Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cart.map((row) => (
                <div
                  key={row.key}
                  className="rounded-none border p-3 space-y-3"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search medicine…"
                        className="pl-9"
                        value={
                          activeRowKey === row.key ? medicineQuery : row.medicineName || ""
                        }
                        onChange={(e) => {
                          setMedicineQuery(e.target.value);
                          setActiveRowKey(row.key);
                        }}
                        onFocus={() => setActiveRowKey(row.key)}
                      />
                      {activeRowKey === row.key &&
                        medicineQuery.trim().length >= 1 && (
                          <div className="absolute z-50 mt-1 w-full rounded-none border bg-popover shadow-md max-h-60 overflow-y-auto">
                            {medicineResults.isLoading ? (
                              <p className="p-3 text-center text-sm text-muted-foreground">
                                Searching…
                              </p>
                            ) : medicineResults.data?.data?.length ? (
                              medicineResults.data.data.map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                                  onClick={() => selectMedicine(m, row.key)}
                                >
                                  <span>
                                    {m.name}
                                    {m.strength ? ` ${m.strength}` : ""}
                                    {m.genericName &&
                                    m.genericName !== m.name ? (
                                      <span className="ml-2 text-xs text-muted-foreground">
                                        {m.genericName}
                                      </span>
                                    ) : null}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {m.unit}
                                  </span>
                                </button>
                              ))
                            ) : (
                              <p className="p-3 text-center text-sm text-muted-foreground">
                                No medicines found
                              </p>
                            )}
                          </div>
                        )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      title="Remove item"
                      onClick={() => removeRow(row.key)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Field>
                      <FieldLabel>Qty *</FieldLabel>
                      <Input
                        type="number"
                        min={1}
                        value={row.quantity}
                        onChange={(e) =>
                          updateRow(row.key, {
                            quantity: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Purchase Rate (paise) *</FieldLabel>
                      <Input
                        type="number"
                        min={0}
                        value={row.purchaseRate}
                        onChange={(e) =>
                          updateRow(row.key, {
                            purchaseRate: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel>MRP (paise)</FieldLabel>
                      <Input
                        type="number"
                        min={0}
                        value={row.mrp}
                        onChange={(e) =>
                          updateRow(row.key, {
                            mrp: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Batch No</FieldLabel>
                      <Input
                        placeholder="e.g. B123"
                        value={row.batchNo}
                        onChange={(e) =>
                          updateRow(row.key, { batchNo: e.target.value })
                        }
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel>Expiry Date</FieldLabel>
                      <Input
                        type="date"
                        value={row.expiryDate}
                        onChange={(e) =>
                          updateRow(row.key, { expiryDate: e.target.value })
                        }
                      />
                    </Field>
                    {row.medicineId && (
                      <div className="flex items-end">
                        <Badge variant="outline" className="text-xs">
                          <Package className="mr-1 size-3" />
                          {row.medicineName}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={addRow}
              >
                <Plus className="mr-2 size-4" /> Add another item
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Summary & details */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Purchase Details</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>Supplier Name</FieldLabel>
                  <Input
                    placeholder="e.g. MedSupply Co."
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel>Purchase Date</FieldLabel>
                  <Input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel>Tax (paise)</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    value={tax}
                    onChange={(e) =>
                      setTax(Math.max(0, Number(e.target.value) || 0))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>Notes</FieldLabel>
                  <Input
                    placeholder="Optional notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span>
                  {cart.filter((r) => r.medicineId).length} line(s)
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{currency(subtotal)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{currency(tax)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t pt-3 text-base font-semibold">
                <span>Total</span>
                <span>{currency(total)}</span>
              </div>
              <Button
                className="w-full"
                disabled={!isValid}
                onClick={() => purchaseMutation.mutate()}
              >
                {purchaseMutation.isPending
                  ? "Recording…"
                  : `Record Purchase · ${currency(total)}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
