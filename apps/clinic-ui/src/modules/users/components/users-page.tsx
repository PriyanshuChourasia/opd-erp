import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Search, Users as UsersIcon } from "lucide-react";
import { fetchUsers, type User } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { DataTable } from "@/components/data-table/data-table";

export function UsersPage() {
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });

  const { data: response, isLoading } = useQuery({
    queryKey: ["users", search, pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      fetchUsers({
        search: search || undefined,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      }),
    placeholderData: (previous) => previous,
  });

  const users = response?.data ?? [];
  const pageCount = response?.meta.totalPages ?? 0;

  const columns = useMemo<ColumnDef<User>[]>(() => [
    {
      id: "name",
      header: "Name",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">{initials(user.firstName)}</AvatarFallback>
            </Avatar>
            <p className="truncate font-medium text-sm">{user.firstName} {user.lastName}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.email}</span>,
    },
    {
      id: "role",
      header: "Role",
      cell: ({ row }) => <Badge variant="secondary">{row.original.role.name}</Badge>,
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "outline"}>
          {row.original.isActive ? "active" : "inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ], []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">View your team members and their access</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
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
          <DataTable
            columns={columns}
            data={users}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <UsersIcon className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">{search ? "No users found" : "No users yet"}</p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
