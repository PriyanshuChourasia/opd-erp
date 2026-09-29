import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type RowData,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "./data-table-pagination";
import { SearchX } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Set on numeric columns so the value and header align right and use
     *  tabular figures, so money and quantities line up by digit. */
    align?: "left" | "center" | "right";
  }
}

export type DataTableDensity = "comfortable" | "compact";

/** Rows rendered while loading, to keep the table from collapsing in height. */
const SKELETON_ROWS = 5;

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  isLoading?: boolean;
  /** Overrides the whole empty state (kept for pages that render their own). */
  emptyState?: ReactNode;
  emptyIcon?: ReactNode;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  density?: DataTableDensity;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  getRowId?: (row: TData, index: number) => string;
  /** Extra classes for the scroll viewport (e.g. to change max height). */
  scrollAreaClassName?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  pagination,
  onPaginationChange,
  isLoading,
  emptyState,
  emptyIcon,
  emptyMessage = "No results found.",
  emptyAction,
  density = "comfortable",
  rowSelection,
  onRowSelectionChange,
  getRowId,
  scrollAreaClassName,
}: DataTableProps<TData, TValue>) {
  const compact = density === "compact";

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: { pagination, ...(rowSelection ? { rowSelection } : {}) },
    onPaginationChange,
    ...(onRowSelectionChange ? { onRowSelectionChange } : {}),
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    enableRowSelection: Boolean(onRowSelectionChange),
    ...(getRowId ? { getRowId } : {}),
  });

  const rows = table.getRowModel().rows;
  const colSpan = columns.length;

  return (
    <div className="flex flex-col">
      {/* The shadcn <Table> wraps the <table> in `overflow-x-auto`, which
          forces overflow-y to `auto` and makes it the nearest scrollport — so a
          sticky <thead> only works if that wrapper actually scrolls. Cap it
          with a max-height and let it scroll vertically; the arbitrary
          variants target the wrapper from here since <Table> only forwards
          className to the <table> itself. */}
      <div
        className={cn(
          "[&_[data-slot=table-container]]:max-h-[70vh] [&_[data-slot=table-container]]:overflow-auto",
          scrollAreaClassName
        )}
      >
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const align = header.column.columnDef.meta?.align;
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "h-9 bg-muted/80 text-xs font-medium tracking-wide text-muted-foreground uppercase",
                        align === "right" && "text-right",
                        align === "center" && "text-center"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="hover:bg-transparent">
                  {columns.map((_col, j) => {
                    const align = (_col.meta as { align?: string } | undefined)?.align;
                    return (
                      <TableCell key={j} className={compact ? "py-1.5" : undefined}>
                        <Skeleton className={cn("h-4", align === "right" ? "ml-auto w-20" : "w-32")} />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={colSpan} className="h-40 text-center">
                  {emptyState ?? (
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <span aria-hidden="true" className="text-muted-foreground/50">
                        {emptyIcon ?? <SearchX className="size-6" />}
                      </span>
                      <p className="text-sm">{emptyMessage}</p>
                      {emptyAction}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const selected = row.getIsSelected();
                return (
                  <TableRow
                    key={row.id}
                    data-state={selected ? "selected" : undefined}
                    aria-selected={rowSelection ? selected : undefined}
                    className={cn(
                      // `!` is required: <TableRow> already applies
                      // hover:bg-muted/50 and that rule is emitted later in the
                      // stylesheet, so an equal-specificity class would lose.
                      "hover:bg-accent/50!",
                      selected && "bg-accent shadow-[inset_2px_0_0_0_var(--primary)]"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const align = cell.column.columnDef.meta?.align;
                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            compact && "py-1.5",
                            align === "right" && "text-right tabular",
                            align === "center" && "text-center"
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
