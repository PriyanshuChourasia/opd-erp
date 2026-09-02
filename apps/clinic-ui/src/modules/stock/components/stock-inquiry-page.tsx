import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  Package,
  Search,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  fetchMedicines,
  fetchStockSummary,
  type Medicine,
  type StockSummary,
  type StockBatchSummary,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function currency(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysUntilExpiry(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ dateStr }: { dateStr: string | null }) {
  const days = daysUntilExpiry(dateStr);
  if (days === null)
    return (
      <Badge variant="outline" className="text-[10px]">
        No expiry
      </Badge>
    );
  if (days < 0)
    return (
      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px]">
        Expired
      </Badge>
    );
  if (days <= 30)
    return (
      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px]">
        <AlertTriangle className="mr-1 size-3" />
        {days}d left
      </Badge>
    );
  if (days <= 90)
    return (
      <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px]">
        {days}d left
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-[10px]">
      {days}d left
    </Badge>
  );
}

interface MedicineWithStock extends Medicine {
  stockSummary: StockSummary | null;
}

function MedicineRow({ medicine }: { medicine: MedicineWithStock }) {
  const [expanded, setExpanded] = useState(false);
  const batches = medicine.stockSummary?.batches ?? [];
  const totalQty = medicine.stockSummary?.totalQty ?? Number(medicine.currentStock ?? "0");
  const totalValue = medicine.stockSummary?.totalValue ?? 0;

  return (
    <>
      <TableRow
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <TableCell>
          <div className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Package className="size-3.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium">{medicine.name}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                {[medicine.genericName, medicine.strength, medicine.unit]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-right">
          <span className="font-semibold">{totalQty}</span>
          <span className="ml-1 text-xs text-muted-foreground">
            {medicine.unit}
          </span>
        </TableCell>
        <TableCell className="text-right text-sm">
          {currency(totalValue)}
        </TableCell>
        <TableCell className="text-right">
          {batches.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? (
                <ChevronDown className="size-3" />
              ) : (
                <ChevronRight className="size-3" />
              )}
              {batches.length} batch(es)
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">No batches</span>
          )}
        </TableCell>
      </TableRow>
      {expanded && batches.length > 0 && (
        <TableRow>
          <TableCell colSpan={4} className="bg-muted/30 p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-16 text-xs">Batch No</TableHead>
                  <TableHead className="text-xs">Expiry</TableHead>
                  <TableHead className="text-right text-xs">
                    Purchase Rate
                  </TableHead>
                  <TableHead className="text-right text-xs">MRP</TableHead>
                  <TableHead className="text-right text-xs">Qty</TableHead>
                  <TableHead className="text-right text-xs">Value</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.batchId}>
                    <TableCell className="pl-16 text-sm font-medium">
                      {batch.batchNo ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(batch.expiryDate)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {currency(batch.purchaseRate)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {currency(batch.mrp)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {batch.currentQty}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {currency(batch.currentQty * batch.purchaseRate)}
                    </TableCell>
                    <TableCell>
                      <ExpiryBadge dateStr={batch.expiryDate} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function StockInquiryPage() {
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: [
      "medicines",
      search,
      pagination.pageIndex,
      pagination.pageSize,
    ],
    queryFn: () =>
      fetchMedicines({
        search: search || undefined,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      }),
    placeholderData: (previous) => previous,
  });

  const medicines = response?.data ?? [];
  const pageCount = response?.meta?.totalPages ?? 0;

  // Fetch stock summaries for visible medicines
  const [stockSummaries, setStockSummaries] = useState<
    Map<string, StockSummary | null>
  >(new Map());

  // Fetch stock summaries for medicines that don't have one yet
  const queryClient = useQueryClient();
  const medicinesNeedingStock = medicines.filter(
    (m) => !stockSummaries.has(m.id),
  );

  // Use a separate query for each medicine's stock summary
  // (rendered as a component-level effect to avoid hook-in-loop)
  const [summaryFetching, setSummaryFetching] = useState(false);

  // Fetch all summaries in parallel on mount / when medicines change
  useMemo(() => {
    if (medicinesNeedingStock.length === 0) return;
    setSummaryFetching(true);
    Promise.all(
      medicinesNeedingStock.map(async (m) => {
        try {
          const summary = await queryClient.fetchQuery({
            queryKey: ["stock-summary", m.id],
            queryFn: () => fetchStockSummary(m.id),
            staleTime: 60_000,
          });
          return [m.id, summary] as const;
        } catch {
          return [m.id, null] as const;
        }
      }),
    ).then((results) => {
      setStockSummaries((prev) => {
        const next = new Map(prev);
        for (const [id, summary] of results) {
          next.set(id, summary);
        }
        return next;
      });
      setSummaryFetching(false);
    });
  }, [medicines.map((m) => m.id).join(",")]);

  const medicinesWithStock: MedicineWithStock[] = useMemo(
    () =>
      medicines.map((m) => ({
        ...m,
        stockSummary: stockSummaries.get(m.id) ?? null,
      })),
    [medicines, stockSummaries],
  );

  // Summary stats
  const totalMedicines = medicinesWithStock.length;
  const totalStockQty = medicinesWithStock.reduce(
    (sum, m) => sum + (m.stockSummary?.totalQty ?? 0),
    0,
  );
  const lowStockCount = medicinesWithStock.filter((m) => {
    const qty = m.stockSummary?.totalQty ?? 0;
    return m.openingStock && qty < Number(m.openingStock) * 0.2;
  }).length;
  const expiredBatchCount = medicinesWithStock.reduce((count, m) => {
    return (
      count +
      (m.stockSummary?.batches.filter((b) => {
        if (!b.expiryDate) return false;
        return new Date(b.expiryDate) < new Date();
      }).length ?? 0)
    );
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Stock Inquiry
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Current stock levels, batch details, and expiry tracking per medicine
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Package className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-bold">{totalMedicines}</p>
              <p className="text-xs text-muted-foreground">Medicines tracked</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              <Package className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-bold">{totalStockQty}</p>
              <p className="text-xs text-muted-foreground">
                Total units in stock
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <AlertTriangle className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-bold">{lowStockCount}</p>
              <p className="text-xs text-muted-foreground">Low stock items</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              <AlertTriangle className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-bold">{expiredBatchCount}</p>
              <p className="text-xs text-muted-foreground">Expired batches</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medicine table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Medicine Stock</CardTitle>
            {summaryFetching && (
              <Badge variant="outline" className="text-[10px]">
                Loading stock data…
              </Badge>
            )}
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search medicines…"
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine</TableHead>
                <TableHead className="text-right">Stock Qty</TableHead>
                <TableHead className="text-right">Stock Value</TableHead>
                <TableHead className="text-right">Batches</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              ) : medicinesWithStock.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Package className="size-8 text-muted-foreground/50" />
                      <p>
                        {search
                          ? "No medicines found"
                          : "No medicines in catalog"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                medicinesWithStock.map((m) => (
                  <MedicineRow key={m.id} medicine={m} />
                ))
              )}
            </TableBody>
          </Table>

          {pageCount > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {pagination.pageIndex + 1} of {pageCount}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.pageIndex === 0}
                  onClick={() =>
                    setPagination((p) => ({
                      ...p,
                      pageIndex: p.pageIndex - 1,
                    }))
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.pageIndex >= pageCount - 1}
                  onClick={() =>
                    setPagination((p) => ({
                      ...p,
                      pageIndex: p.pageIndex + 1,
                    }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
