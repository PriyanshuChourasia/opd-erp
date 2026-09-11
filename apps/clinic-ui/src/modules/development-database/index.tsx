import { useState } from "react";
import {
  Database,
  Download,
  HardDrive,
  CalendarRange,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchDatabaseTables, downloadTableBackup, downloadDocumentBackup, downloadFullSnapshot, downloadRangeSnapshot, extractApiError } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function DevelopmentDatabasePage() {
  const [table, setTable] = useState("");
  const [docId, setDocId] = useState("");
  const [rangeTable, setRangeTable] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: tablesResponse, isLoading: tablesLoading } = useQuery({
    queryKey: ["database-operations/tables"],
    queryFn: fetchDatabaseTables,
    enabled: true,
  });

  const tables = tablesResponse?.data ?? [];

  const rangeDisabled = !startDate || !endDate || startDate > endDate;

  async function handleTableBackup() {
    if (!table) return;
    try {
      await downloadTableBackup(table);
      toast.success(`${table} backup downloaded`);
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  async function handleDocumentBackup() {
    if (!table || !docId) return;
    try {
      await downloadDocumentBackup(table, docId);
      toast.success(`${table} record backup downloaded`);
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  async function handleFullSnapshot() {
    try {
      await downloadFullSnapshot();
      toast.success("Full database snapshot downloaded");
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  async function handleRangeSnapshot() {
    if (rangeDisabled) return;
    try {
      await downloadRangeSnapshot({ table: rangeTable || undefined, startDate, endDate });
      toast.success("Date range snapshot downloaded");
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Database Operations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Backup, snapshot, and export operations against the database.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Table Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Model</TableHead>
                <TableHead className="w-40">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="pl-6">
                  <Select value={table} onValueChange={setTable}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Select a table…" />
                    </SelectTrigger>
                    <SelectContent>
                      {tablesLoading ? (
                        <SelectItem value="loading" disabled>
                          <Loader2 className="size-4 mr-2 animate-spin" /> Loading tables…
                        </SelectItem>
                      ) : (
                        tables.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="pr-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTableBackup}
                    disabled={!table || tablesLoading}
                    className="gap-2"
                  >
                    {tablesLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Loading…
                      </>
                    ) : (
                      <>
                        <Download className="size-4" />
                        Download Backup
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Document Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Model</TableHead>
                <TableHead className="w-32">Record ID</TableHead>
                <TableHead className="w-40">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="pl-6">
                  <Select value={table} onValueChange={setTable}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Select a table…" />
                    </SelectTrigger>
                    <SelectContent>
                      {tablesLoading ? (
                        <SelectItem value="loading" disabled>
                          <Loader2 className="size-4 mr-2 animate-spin" /> Loading tables…
                        </SelectItem>
                      ) : (
                        tables.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="py-3">
                  <Input
                    placeholder="Record id…"
                    value={docId}
                    onChange={(e) => setDocId(e.target.value)}
                  />
                </TableCell>
                <TableCell className="pr-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDocumentBackup}
                    disabled={!table || !docId || tablesLoading}
                    className="gap-2"
                  >
                    {tablesLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Loading…
                      </>
                    ) : (
                      <>
                        <Download className="size-4" />
                        Download Backup
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Full Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Complete pg_dump snapshot of the database (binary dump).
          </p>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleFullSnapshot}
              disabled={tablesLoading}
              className="gap-2"
            >
              {tablesLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Preparing…
                </>
              ) : (
                <>
                  <HardDrive className="size-4" />
                  Download Full Snapshot
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Date Range Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Model</TableHead>
                <TableHead className="w-36">Start Date</TableHead>
                <TableHead className="w-36">End Date</TableHead>
                <TableHead className="w-40">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="pl-6">
                  <Select value={rangeTable} onValueChange={setRangeTable}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="All tables…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All tables</SelectItem>
                      {tablesLoading ? (
                        <SelectItem value="loading" disabled>
                          <Loader2 className="size-4 mr-2 animate-spin" /> Loading tables…
                        </SelectItem>
                      ) : (
                        tables.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="py-3">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </TableCell>
                <TableCell className="py-3">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </TableCell>
                <TableCell className="pr-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRangeSnapshot}
                    disabled={rangeDisabled || tablesLoading}
                    className="gap-2"
                  >
                    {tablesLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Loading…
                      </>
                    ) : (
                      <>
                        <CalendarRange className="size-4" />
                        Download Snapshot
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

