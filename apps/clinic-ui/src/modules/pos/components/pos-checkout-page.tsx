import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, Search, Trash2, UserRound, X } from "lucide-react";
import { createBill, searchMedicines, searchPatients } from "../data/api";
import { fetchAppointmentInvoicePreview } from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CartItem, DiscountMode, PaymentMethod } from "../data/interface";
import { paymentMethods, currency } from "../data/interface";

const posIndexRoute = getRouteApi("/_pos/pos/");

export function PosCheckoutPage() {
  const { appointmentId } = posIndexRoute.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [patientQuery, setPatientQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string; phone: string } | null>(null);
  const [itemQuery, setItemQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountMode, setDiscountMode] = useState<DiscountMode>("percent");
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

  const invoicePreview = useQuery({
    queryKey: ["appointment-invoice-preview", appointmentId],
    queryFn: () => fetchAppointmentInvoicePreview(appointmentId!),
    enabled: !!appointmentId,
  });

  useEffect(() => {
    if (!invoicePreview.data || invoicePreview.data.alreadyInvoiced) return;
    const { appointment, items } = invoicePreview.data;
    setSelectedPatient({ id: appointment.patient.id, name: appointment.patient.name, phone: appointment.patient.phone });
    setCart(items.map((item) => ({ id: crypto.randomUUID(), itemType: item.itemType, itemId: item.itemId, description: item.itemName, quantity: item.quantity ?? 1, unitPrice: item.unitPrice })));
  }, [invoicePreview.data]);

  const patientResults = useQuery({
    queryKey: ["pos-patients", patientQuery],
    queryFn: () => searchPatients(patientQuery),
    enabled: patientQuery.trim().length >= 2 && !selectedPatient,
  });

  const medicineResults = useQuery({
    queryKey: ["pos-medicines", itemQuery],
    queryFn: () => searchMedicines(itemQuery),
    enabled: itemQuery.trim().length >= 2,
  });

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0), [cart]);
  const discountAmount = discountMode === "percent" ? (subtotal * discountValue) / 100 : discountValue;
  const total = Math.max(0, subtotal - discountAmount);

  const checkoutMutation = useMutation({
    mutationFn: () => createBill({
      patientId: selectedPatient?.id ?? null,
      appointmentId: appointmentId || undefined,
      items: cart.map((item) => ({ itemType: item.itemType ?? "MEDICINE", itemId: item.itemId, itemName: item.description, quantity: item.quantity, unitPrice: item.unitPrice })),
      discount: discountAmount,
      paymentMethod,
    }),
    onSuccess: () => {
      setCart([]);
      setSelectedPatient(null);
      setDiscountValue(0);
      toast.success("Sale completed successfully");
      if (appointmentId) {
        queryClient.invalidateQueries({ queryKey: ["appointments"] });
        navigate({ to: "/pos" });
      }
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  function addMedicineToCart(medicine: { id: string; brandName: string; genericName: string; strength: string }) {
    setCart((prev) => [...prev, { id: crypto.randomUUID(), description: [medicine.brandName, medicine.strength].filter(Boolean).join(" "), quantity: 1, unitPrice: 0 }]);
    setItemQuery("");
  }

  function addCustomItem() { setCart((prev) => [...prev, { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 }]); }
  function updateCartItem(id: string, patch: Partial<CartItem>) { setCart((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item))); }
  function removeCartItem(id: string) { setCart((prev) => prev.filter((item) => item.id !== id)); }

  if (appointmentId && invoicePreview.data?.alreadyInvoiced) {
    return (
      <Card className="flex-1">
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            This appointment is already invoiced as <span className="font-medium text-foreground">{invoicePreview.data.appointment.bill?.invoiceNo}</span>.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/pos" })}>Back to checkout</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {appointmentId && (
        <div className="rounded-none border border-primary/30 bg-primary/5 px-4 py-2 text-sm text-primary">
          {invoicePreview.isLoading ? "Loading appointment…" : "Generating invoice for a completed appointment — the consultation fee is pre-filled below."}
        </div>
      )}
      <div className="grid flex-1 gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <Card><CardHeader><CardTitle className="text-sm">Patient</CardTitle></CardHeader>
          <CardContent>{selectedPatient ? (
            <div className="flex items-center justify-between rounded-none border px-3 py-2">
              <div className="flex items-center gap-2"><UserRound className="size-4 text-muted-foreground" /><div><p className="text-sm font-medium">{selectedPatient.name}</p><p className="text-xs text-muted-foreground">{selectedPatient.phone}</p></div></div>
              <Button variant="ghost" size="icon-sm" onClick={() => setSelectedPatient(null)}><X /></Button>
            </div>
          ) : (
            <div className="relative"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search patient by name or phone (or leave blank for walk-in)" className="pl-9" value={patientQuery} onChange={(e) => setPatientQuery(e.target.value)} />
              {patientQuery.trim().length >= 2 && (
                <div className="absolute z-10 mt-1 w-full rounded-none border bg-popover shadow-md">
                  {patientResults.data?.map((patient: any) => (
                    <button key={patient.id} type="button" className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => { setSelectedPatient(patient); setPatientQuery(""); }}>
                      <span className="font-medium">{patient.name}</span><span className="text-xs text-muted-foreground">{patient.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}</CardContent>
        </Card>

        <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-sm">Items</CardTitle><Button variant="outline" size="sm" onClick={addCustomItem}><Plus />Custom item</Button></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="relative"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search medicine catalog to add to cart" className="pl-9" value={itemQuery} onChange={(e) => setItemQuery(e.target.value)} />
              {itemQuery.trim().length >= 2 && (
                <div className="absolute z-10 mt-1 w-full rounded-none border bg-popover shadow-md">
                  {medicineResults.data?.map((medicine: any) => (
                    <button key={medicine.id} type="button" className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => addMedicineToCart(medicine)}>
                      <span>{medicine.brandName}{medicine.strength ? ` ${medicine.strength}` : ""}<span className="ml-2 text-xs text-muted-foreground">{medicine.genericName}</span></span><Plus className="size-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="w-32 text-center">Qty</TableHead><TableHead className="w-28 text-right">Unit price</TableHead><TableHead className="w-24 text-right">Total</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
              <TableBody>{cart.length === 0 && (<TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Cart is empty — search the catalog or add a custom item.</TableCell></TableRow>)}
                {cart.map((item) => (<TableRow key={item.id}>
                  <TableCell><Input value={item.description} placeholder="Description" onChange={(e) => updateCartItem(item.id, { description: e.target.value })} /></TableCell>
                  <TableCell><div className="flex items-center justify-center gap-1"><Button type="button" variant="outline" size="icon-sm" onClick={() => updateCartItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}><Minus /></Button><span className="w-6 text-center text-sm">{item.quantity}</span><Button type="button" variant="outline" size="icon-sm" onClick={() => updateCartItem(item.id, { quantity: item.quantity + 1 })}><Plus /></Button></div></TableCell>
                  <TableCell><Input type="number" min={0} className="text-right" value={item.unitPrice} onChange={(e) => updateCartItem(item.id, { unitPrice: Number(e.target.value) || 0 })} /></TableCell>
                  <TableCell className="text-right text-sm font-medium">{currency(item.quantity * item.unitPrice)}</TableCell>
                  <TableCell><Button type="button" variant="ghost" size="icon-sm" onClick={() => removeCartItem(item.id)}><Trash2 className="text-destructive" /></Button></TableCell>
                </TableRow>))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit lg:sticky lg:top-6">
        <CardHeader><CardTitle className="text-sm">Order summary</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{currency(subtotal)}</span></div>
          <div className="flex flex-col gap-2"><span className="text-sm text-muted-foreground">Discount</span>
            <div className="flex gap-2"><div className="flex rounded-none border p-0.5">{(["percent", "flat"] as const).map((mode) => (
              <button key={mode} type="button" className={cn("rounded px-2 py-1 text-xs font-medium", discountMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground")} onClick={() => setDiscountMode(mode)}>{mode === "percent" ? "%" : "Flat"}</button>
            ))}</div><Input type="number" min={0} value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value) || 0)} /></div>
          </div>
          <div className="flex flex-col gap-2"><span className="text-sm text-muted-foreground">Payment method</span>
            <div className="flex gap-2">{paymentMethods.map((method) => (
              <button key={method.value} type="button" className={cn("flex-1 rounded-none border px-2 py-1.5 text-xs font-medium", paymentMethod === method.value ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground")} onClick={() => setPaymentMethod(method.value)}>{method.label}</button>
            ))}</div>
          </div>
          <div className="flex items-center justify-between border-t pt-4 text-base font-semibold"><span>Total</span><span>{currency(total)}</span></div>
          {selectedPatient ? <Badge variant="outline" className="w-fit">{selectedPatient.name}</Badge> : <Badge variant="outline" className="w-fit text-muted-foreground">Walk-in customer</Badge>}
          {checkoutMutation.isError && <p className="text-sm text-destructive">{(checkoutMutation.error as Error).message}</p>}
          {checkoutMutation.isSuccess && <p className="text-sm text-primary">Sale completed.</p>}
        </CardContent>
        <CardFooter><Button className="w-full" disabled={cart.length === 0 || checkoutMutation.isPending} onClick={() => checkoutMutation.mutate()}>{checkoutMutation.isPending ? "Processing..." : `Complete sale · ${currency(total)}`}</Button></CardFooter>
      </Card>
      </div>
    </div>
  );
}
