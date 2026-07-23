import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useOutstandingBills } from "../data/hooks";
import { formatCurrency, statusBadgeClass, formatStatus } from "../data/utils";

export function OutstandingBillsPage() {
  const query = useOutstandingBills();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Outstanding Bills</h1>
        <p className="text-sm text-muted-foreground">Unpaid and partially paid invoices by aging bucket</p>
      </div>

      {query.isLoading ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </>
      ) : !query.data ? (
        <p className="text-sm text-muted-foreground">No data</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {query.data.bucketSummary.map((bucket) => (
              <Card key={bucket.bucket}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {bucket.bucket === "31+" ? "31+ days (overdue)" : `${bucket.bucket} days`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold tabular-nums">{formatCurrency(bucket.amount)}</p>
                  <p className="text-xs text-muted-foreground">{bucket.count} bill{bucket.count !== 1 ? "s" : ""}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All outstanding bills</CardTitle>
            </CardHeader>
            <CardContent>
              {query.data.bills.length === 0 ? (
                <p className="text-sm text-muted-foreground">No outstanding bills</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Age (days)</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {query.data.bills.map((bill) => (
                        <TableRow
                          key={bill.id}
                          className={bill.ageDays > 30 ? "bg-red-50/50 dark:bg-red-950/10" : ""}
                        >
                          <TableCell className="font-mono text-xs">{bill.invoiceNo}</TableCell>
                          <TableCell>{bill.patientName}</TableCell>
                          <TableCell className="font-mono text-xs">{bill.patientPhone}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(bill.total)}</TableCell>
                          <TableCell className="text-right tabular-nums">{bill.ageDays}</TableCell>
                          <TableCell>
                            <Badge className={statusBadgeClass(bill.status)} variant="outline">
                              {formatStatus(bill.status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
