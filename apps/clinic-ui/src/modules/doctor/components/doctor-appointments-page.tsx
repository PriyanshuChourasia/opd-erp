import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { PaginationState } from "@tanstack/react-table";
import { CalendarClock, Eye, Search } from "lucide-react";
import { getPatientName } from "@/lib/api";
import { fetchAppointments, type Appointment } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";
import type { ColumnDef } from "@tanstack/react-table";

function todayStr() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-amber-100 text-amber-700",
  CHECKED_IN: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-600",
  RESCHEDULED: "bg-purple-100 text-purple-700",
  NO_SHOW: "bg-red-100 text-red-700",
};

function currency(value: number) {
  return `₹${value.toFixed(2)}`;
}

export function DoctorAppointmentsPage() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const doctorId = user?.userableId;

  const [filterDate, setFilterDate] = useState(todayStr());
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  // Debounce search
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      setSearch(value.trim());
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, 300);
    setDebounceTimer(timer);
  }

  const { data: response, isLoading } = useQuery({
    queryKey: ["doctor-appointments", doctorId, filterDate, search, pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      fetchAppointments({
        doctorId: doctorId || undefined,
        date: filterDate || undefined,
        search: search || undefined,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      }),
    enabled: !!doctorId,
    placeholderData: (previous) => previous,
  });

  const appointments = useMemo(() => response?.data ?? [], [response]);
  const pageCount = response?.meta?.totalPages ?? 0;

  const columns = useMemo<ColumnDef<Appointment>[]>(
    () => [
      {
        id: "patient",
        header: "Patient",
        cell: ({ row }) => {
          const appt = row.original;
          return (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {appt.patient ? getPatientName(appt.patient) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {appt.patient?.contactNo}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={`text-[10px] ${STATUS_STYLES[row.original.status] ?? ""}`}
          >
            {row.original.status.replace("_", " ")}
          </Badge>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.type.replace("_", " ")}
          </span>
        ),
      },
      {
        id: "time",
        header: "Time",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.original.date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ),
      },
      {
        accessorKey: "fee",
        header: "Fee",
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {currency(row.original.fee)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            title="View appointment"
            onClick={() =>
              navigate({
                to: "/appointments/$appointmentId/edit",
                params: { appointmentId: row.original.id },
              })
            }
          >
            <Eye className="size-4" />
          </Button>
        ),
      },
    ],
    [navigate],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            My Appointments
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant={!search && !filterDate ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilterDate("");
              setSearch("");
              setSearchInput("");
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          >
            All
          </Button>
          <Button
            variant={filterDate === todayStr() ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilterDate(todayStr());
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          >
            Today
          </Button>
          <Button
            variant={filterDate === tomorrowStr() ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilterDate(tomorrowStr());
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          >
            Tomorrow
          </Button>
          <Input
            type="date"
            className="w-auto"
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Appointments</CardTitle>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search patient name or phone..."
                className="w-64 pl-9"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={appointments}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CalendarClock className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {filterDate === todayStr()
                    ? "No appointments today"
                    : "No appointments for this date"}
                </p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
