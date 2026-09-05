import { useEffect, useState } from "react";
import { ClipboardList, Pill, Search } from "lucide-react";
import { getPatientName } from "@/lib/api";
import type { Prescription } from "@/lib/api";
import { usePrescriptions } from "../data/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const RX_STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-700",
  DISPENSED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const PAGE_SIZE = 20;

/**
 * Prescriptions page — doctor-scoped list with search and pagination.
 *
 * SRP: Only responsible for the prescriptions list view.
 * Data fetching delegated to usePrescriptions hook.
 */
export function AdminPrescriptions() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: response, isLoading } = usePrescriptions(search, page, PAGE_SIZE);
  const prescriptions = response?.data ?? [];
  const totalPages = response?.meta?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Prescriptions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View patient prescriptions and diagnoses
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patient, diagnosis..."
            className="h-9 pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <ClipboardList className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No prescriptions found</p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 border-b px-4 py-3 text-xs font-medium text-muted-foreground">
                <span>Patient</span>
                <span>Diagnosis</span>
                <span>Status</span>
                <span>Items</span>
                <span>Date</span>
              </div>
              {/* Table rows */}
              <div className="divide-y">
                {prescriptions.map((rx) => (
                  <PrescriptionRow key={rx.id} rx={rx} />
                ))}
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Page {page + 1} of {totalPages || 1}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Single prescription row — SRP: renders one prescription record.
 */
function PrescriptionRow({ rx }: { rx: Prescription }) {
  return (
    <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-4 py-3 text-sm">
      <span className="truncate">
        {rx.patient ? getPatientName(rx.patient) : <span className="text-muted-foreground">—</span>}
      </span>
      <span className="truncate">
        {rx.diagnosis || <span className="text-muted-foreground">—</span>}
      </span>
      <Badge variant="outline" className={`text-[10px] uppercase ${RX_STATUS_STYLES[rx.status] ?? ""}`}>
        {rx.status}
      </Badge>
      <span className="flex items-center gap-1">
        <Pill className="size-3 text-muted-foreground" />
        {rx.items?.length ?? 0}
      </span>
      <span className="text-muted-foreground">
        {new Date(rx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
      </span>
    </div>
  );
}
