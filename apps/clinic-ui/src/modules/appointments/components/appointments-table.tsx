import { type PaginationState, type OnChangeFn } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/data-table/data-table';
import { CalendarClock } from 'lucide-react';

interface AppointmentsTableProps {
  columns: any[];
  data: any[];
  pageCount: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  isLoading: boolean;
}

export function AppointmentsTable({ columns, data, pageCount, pagination, onPaginationChange, isLoading }: AppointmentsTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Appointments</CardTitle></CardHeader>
      <CardContent className="p-0">
        <DataTable
          columns={columns}
          data={data}
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={onPaginationChange}
          isLoading={isLoading}
          emptyState={
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CalendarClock className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No appointments for this day</p>
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}
