import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { BookOpen, Search } from "lucide-react";
import { fetchLedgers, type Ledger } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";
import { cn } from "@/lib/utils";

function currency(value: number) {
  return `₹${(value / 100).toFixed(2)}`;
}

export function LedgerListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const { data: response, isLoading } = useQuery({
    queryKey: ["ledgers", search, pagination.pageIndex, pagination.pageSize],
    queryFn: () => fetchLedgers({ search: search || undefined, page: pagination.pageIndex + 1, limit: pagination.pageSize }),
    placeholderData: (previous) => previous,
  });

  const ledgers = response?.data ?? [];
  const pageCount = response?.meta?.totalPages ?? 0;

  const columns = useMemo<ColumnDef<Ledger>[]>(() => [
    {
      accessorKey: "name",
      header: "Ledger Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BookOpen className="size-3" />
          </span>
          <div>
            <p className="text-sm font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.accountGroup.name}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "accountGroup.nature.name",
      header: "Nature",
      cell: ({ row }) => <Badge variant="outline" className="text-[10px]">{row.original.accountGroup.nature.name}</Badge>,
    },
    {
      accessorKey: "currentBalance",
      header: "Balance",
      cell: ({ row }) => (
        <span className={cn("font-mono text-sm font-medium", row.original.currentBalance >= 0 ? "text-green-600" : "text-red-600")}>
          {currency(row.original.currentBalance)}
        </span>
      ),
    },
    {
      id: "type",
      header: "Type",
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.isCashAccount && <Badge variant="outline" className="text-[9px]">Cash</Badge>}
          {row.original.isBankAccount && <Badge variant="outline" className="text-[9px]">Bank</Badge>}
          {row.original.patientId && <Badge variant="outline" className="text-[9px]">Patient</Badge>}
        </div>
      ),
    },
  ], []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ledgers</h1>
        <p className="mt-1 text-sm text-muted-foreground">All ledger accounts with running balances</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search ledgers…" className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={ledgers}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <BookOpen className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">{search ? "No ledgers found" : "No ledgers yet"}</p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
