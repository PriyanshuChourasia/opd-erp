import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { ArrowLeft, BookOpen } from "lucide-react";
import { fetchLedger, type LedgerWithJournalLines } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";

function currency(value: number) {
  return `₹${(value / 100).toFixed(2)}`;
}

export function LedgerDetailPage() {
  const { ledgerId } = useParams({ from: "/_dashboard/accounting/ledger/$ledgerId" });
  const navigate = useNavigate();

  const { data: ledger, isLoading } = useQuery({
    queryKey: ["ledger", ledgerId],
    queryFn: () => fetchLedger(ledgerId),
    enabled: !!ledgerId,
  });

  const columns: ColumnDef<LedgerWithJournalLines["journalLines"][0]>[] = [
    {
      accessorKey: "journal.voucher.voucherNumber",
      header: "Voucher",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.journal.voucher?.voucherNumber ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "journal.journalType.name",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px]">
          {row.original.journal.journalType.name}
        </Badge>
      ),
    },
    {
      accessorKey: "journal.createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.journal.createdAt).toLocaleDateString("en-IN")}
        </span>
      ),
    },
    {
      accessorKey: "debitAmount",
      header: "Debit",
      cell: ({ row }) => (
        <span className="text-right font-mono text-xs">
          {row.original.debitAmount > 0 ? currency(row.original.debitAmount) : "—"}
        </span>
      ),
    },
    {
      accessorKey: "creditAmount",
      header: "Credit",
      cell: ({ row }) => (
        <span className="text-right font-mono text-xs">
          {row.original.creditAmount > 0 ? currency(row.original.creditAmount) : "—"}
        </span>
      ),
    },
    {
      id: "narration",
      header: "Narration",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground max-w-[200px] truncate">
          {row.original.journal.notes ?? "—"}
        </span>
      ),
    },
  ];

  if (isLoading) return <p className="text-sm text-muted-foreground p-6">Loading…</p>;
  if (!ledger) return <p className="text-sm text-muted-foreground p-6">Ledger not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/accounting/ledgers" })}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{ledger.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ledger.accountGroup.name} · {ledger.accountGroup.nature.name}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Current Balance</p>
            <p className={cn("text-2xl font-bold", ledger.currentBalance >= 0 ? "text-green-600" : "text-red-600")}>
              {currency(ledger.currentBalance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Opening Balance</p>
            <p className="text-lg font-semibold">{currency(ledger.openingBalance)}</p>
            <p className="text-xs text-muted-foreground">{ledger.openingBalanceType ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Account Type</p>
            <div className="flex gap-1 mt-1">
              {ledger.isCashAccount && <Badge variant="outline" className="text-[10px]">Cash</Badge>}
              {ledger.isBankAccount && <Badge variant="outline" className="text-[10px]">Bank</Badge>}
              {ledger.isBillWiseTracking && <Badge variant="outline" className="text-[10px]">Bill-wise</Badge>}
              {!ledger.isCashAccount && !ledger.isBankAccount && !ledger.isBillWiseTracking && (
                <Badge variant="outline" className="text-[10px]">General</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {ledger.patient && (
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">Linked Patient</p>
            <p className="text-sm font-medium">{ledger.patient.firstName} {ledger.patient.lastName} ({ledger.patient.patientCode})</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Journal History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={ledger.journalLines}
            pageCount={1}
            pagination={{ pageIndex: 0, pageSize: 100 }}
            onPaginationChange={() => {}}
            isLoading={false}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <BookOpen className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No journal entries yet</p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
