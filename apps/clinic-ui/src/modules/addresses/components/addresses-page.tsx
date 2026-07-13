import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Building2, Home, MapPin, Receipt, Search } from "lucide-react";
import { fetchAddresses, type Address, ADDRESS_TYPES } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/data-table/data-table";

const ADDRESS_TYPE_ICONS: Record<string, typeof MapPin> = {
  CLINIC: Building2,
  HOME: Home,
  BILLING: Receipt,
  OTHER: MapPin,
};

export function AddressesPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterEntity, setFilterEntity] = useState("");

  const { data: response, isLoading } = useQuery({
    queryKey: ["addresses", "all", filterType, filterEntity, pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      fetchAddresses({
        addressType: filterType || undefined,
        addressableType: filterEntity || undefined,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      }),
    placeholderData: (previous) => previous,
  });

  const addresses = response?.data ?? [];
  const pageCount = response?.meta?.totalPages ?? 0;

  const columns = useMemo<ColumnDef<Address>[]>(() => [
    {
      id: "type",
      header: "Type",
      cell: ({ row }) => {
        const Icon = ADDRESS_TYPE_ICONS[row.original.addressType] ?? MapPin;
        return (
          <span className="flex items-center gap-2 text-sm">
            <Icon className="size-4 text-muted-foreground" />
            <span className="capitalize">{row.original.addressType.toLowerCase()}</span>
          </span>
        );
      },
    },
    {
      id: "address",
      header: "Address",
      cell: ({ row }) => {
        const a = row.original;
        return (
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{a.addressLine1}</p>
            <p className="text-xs text-muted-foreground truncate">
              {[a.city, a.state, a.postalCode].filter(Boolean).join(", ")}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "addressableType",
      header: "Entity",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px]">{row.original.addressableType}</Badge>
      ),
    },
    {
      accessorKey: "addressableId",
      header: "Entity ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.addressableId.slice(0, 8)}</span>
      ),
    },
    {
      accessorKey: "isPrimary",
      header: "Primary",
      cell: ({ row }) =>
        row.original.isPrimary ? (
          <Badge variant="default" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px]">Primary</Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px]" variant="outline">Active</Badge>
        ) : (
          <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-[10px]" variant="outline">Inactive</Badge>
        ),
    },
  ], []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Addresses</h1>
        <p className="mt-1 text-sm text-muted-foreground">View all polymorphic addresses across entities</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search addresses..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }} />
            </div>
            <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="All types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                {ADDRESS_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterEntity} onValueChange={(v) => { setFilterEntity(v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="All entities" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="Doctor">Doctor</SelectItem>
                <SelectItem value="Patient">Patient</SelectItem>
                <SelectItem value="Organisation">Organisation</SelectItem>
                <SelectItem value="User">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={addresses}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <MapPin className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No addresses found</p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
