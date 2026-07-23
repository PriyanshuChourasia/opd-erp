import { useState } from "react";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useInactivePatients } from "../data/hooks";

export function InactivePatientsPage() {
  const [daysSince, setDaysSince] = useState(90);
  const [page, setPage] = useState(1);
  const query = useInactivePatients(daysSince, page);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inactive Patients</h1>
          <p className="text-sm text-muted-foreground">Patients who haven't visited in a while — ready for follow-up</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Days since last visit:</label>
          <select
            value={daysSince}
            onChange={(e) => { setDaysSince(Number(e.target.value)); setPage(1); }}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
            <option value={180}>180 days</option>
            <option value={365}>1 year</option>
          </select>
        </div>
      </div>

      {query.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !query.data ? (
        <p className="text-sm text-muted-foreground">No data</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Inactive patients
              {query.data.meta && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({query.data.meta.total} total)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {query.data.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">No inactive patients found for this threshold</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Last visit</TableHead>
                        <TableHead className="text-right">Days since</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {query.data.data.map((patient) => (
                        <TableRow key={patient.patientId}>
                          <TableCell className="font-medium">{patient.name}</TableCell>
                          <TableCell className="font-mono text-xs">{patient.phone}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(patient.lastVisitDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {patient.daysSinceLastVisit}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {query.data.meta && query.data.meta.totalPages > 1 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => { e.preventDefault(); setPage(Math.max(1, page - 1)); }}
                          className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({ length: query.data.meta.totalPages }, (_, i) => i + 1)
                        .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === query.data.meta!.totalPages)
                        .map((p, idx, arr) => (
                          <PaginationItem key={p}>
                            {idx > 0 && arr[idx - 1] !== p - 1 ? (
                              <span className="px-1 text-muted-foreground">...</span>
                            ) : null}
                            <PaginationLink
                              href="#"
                              isActive={p === page}
                              onClick={(e) => { e.preventDefault(); setPage(p); }}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => { e.preventDefault(); setPage(Math.min(query.data.meta!.totalPages, page + 1)); }}
                          className={page >= query.data.meta.totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
