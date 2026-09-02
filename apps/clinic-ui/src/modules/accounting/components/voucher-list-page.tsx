import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Receipt, Search } from "lucide-react";
import { fetchVouchers, type Voucher } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";

function currency(value: number) {
  return `₹${(value / 100).toFixed(2)}`;
}

const STATUS_STYLES: Record<string, string> = {
  POSTED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  DRAFT: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function VoucherListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const { data: response, isLoading } = useQuery({
    queryKey: ["vouchers", search, pagination.pageIndex, pagination.pageSize],
    queryFn: () => fetchVouchers({ search: search || undefined, page: pagination.pageIndex + 1, limit: pagination.pageSize }),
    placeholderData: (previous) => previous,
  });

  const vouchers = response?.data ?? [];
  const pageCount = response?.meta?.totalPages ?? 0;

  const columns = useMemo<ColumnDef<Voucher>[]>(() => [
    {
      accessorKey: "voucherNumber",
      header: "Voucher #",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Receipt className="size-3" />
          </span>
          <span className="font-mono text-sm font-medium">{row.original.voucherNumber}</span>
        </div>
      ),
    },
    {
      accessorKey: "voucherType.name",
      header: "Type",
      cell: ({ row }) => <Badge variant="outline" className="text-[10px]">{row.original.voucherType.name}</Badge>,
    },
    {
      accessorKey: "voucherDate",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.voucherDate).toLocaleDateString("en-IN")}
        </span>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: "Amount",
      cell: ({ row }) => <span className="font-mono text-sm font-medium">{currency(row.original.totalAmount)}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[row.original.status] ?? ""}`}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "financialYear.name",
      header: "FY",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.financialYear.name}</span>,
    },
  ], []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Vouchers</h1>
        <p className="mt-1 text-sm text-muted-foreground">All accounting vouchers (Sales, Receipt, Payment, etc.)</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search vouchers…" className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={vouchers}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Receipt className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">{search ? "No vouchers found" : "No vouchers yet"}</p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
