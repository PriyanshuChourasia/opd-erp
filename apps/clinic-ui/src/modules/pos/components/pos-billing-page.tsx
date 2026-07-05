import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, CreditCard, Receipt, RotateCcw, Search } from "lucide-react";
import { fetchBills, updateBillStatus } from "../data/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BILL_STATUS_STYLES, currency } from "../data/interface";

export function PosBillingPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: bills = [], isLoading } = useQuery({ queryKey: ["bills"], queryFn: fetchBills, refetchInterval: 15_000 });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateBillStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bills"] }),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bills;
    return bills.filter((b: any) => b.invoiceNo.toLowerCase().includes(q) || b.patient?.name.toLowerCase().includes(q) || b.patient?.phone.includes(q));
  }, [bills, search]);

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-semibold tracking-tight">Billing</h1><p className="mt-1 text-sm text-muted-foreground">Sales invoices and payment status</p></div>
      <Card><CardHeader className="pb-3"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search by invoice number, patient name, or phone..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div></CardHeader>
        <CardContent className="p-0">{isLoading ? (<div className="flex justify-center py-12"><span className="text-sm text-muted-foreground">Loading...</span></div>) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center"><Receipt className="size-8 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">{search ? "No bills found" : "No bills yet"}</p></div>
        ) : (
          <div className="divide-y">{filtered.map((bill: any) => (
            <div key={bill.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/30">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted"><Receipt className="size-4 text-muted-foreground" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><p className="text-sm font-medium">{bill.invoiceNo}</p><Badge variant="outline" className={`text-[10px] ${BILL_STATUS_STYLES[bill.status] ?? ""}`}>{bill.status}</Badge></div>
                <p className="mt-0.5 text-xs text-muted-foreground">{bill.patient ? bill.patient.name : "Walk-in customer"} · {bill.items.length} item{bill.items.length === 1 ? "" : "s"} · {bill.paymentMethod} · {new Date(bill.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold">{currency(bill.total)}</p>
              <div className="flex shrink-0 items-center gap-1">
                {(bill.status === "PENDING" || bill.status === "PARTIAL") && (<Button variant="ghost" size="icon" className="size-8" title="Mark paid" onClick={() => statusMutation.mutate({ id: bill.id, status: "PAID" })}><CreditCard className="size-4 text-green-600" /></Button>)}
                {bill.status === "PAID" && (<Button variant="ghost" size="icon" className="size-8" title="Refund" onClick={() => statusMutation.mutate({ id: bill.id, status: "REFUNDED" })}><RotateCcw className="size-4 text-muted-foreground" /></Button>)}
                {bill.status === "PENDING" && (<Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" title="Cancel" onClick={() => statusMutation.mutate({ id: bill.id, status: "CANCELLED" })}><Ban className="size-4" /></Button>)}
              </div>
            </div>
          ))}</div>
        )}</CardContent>
      </Card>
    </div>
  );
}
