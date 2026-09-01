import { IsISO8601, IsOptional } from 'class-validator';

/**
 * Mixin-style DTO that adds optional date range fields.
 * Extend this alongside PaginationQueryDto (or any other base) to get
 * consistent `from` / `to` filtering across list endpoints.
 *
 * Usage:
 *   export class FindFooQueryDto extends PaginationQueryDto
 *     implements DateRangeQuery {
 *     // ...your own fields...
 *   }
 *   applyDateRange(where, query);   // in the service
 */
export interface DateRangeQuery {
  from?: string;
  to?: string;
}

export class DateRangeQueryDto implements DateRangeQuery {
  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}

/**
 * Helper – mutates `where` in-place to add createdAt range when `from` / `to`
 * are present.  Returns the (mutated) where for convenience.
 */
export function applyCreatedAtRange(
  where: Record<string, unknown>,
  query: DateRangeQuery,
): Record<string, unknown> {
  if (query.from || query.to) {
    const range: Record<string, Date> = {};
    if (query.from) range.gte = new Date(query.from);
    if (query.to) {
      // Inclusive end-of-day: add 1 day and use lt so the whole "to" day is included
      const end = new Date(query.to);
      end.setUTCDate(end.getUTCDate() + 1);
      range.lt = end;
    }
    where.createdAt = range;
  }
  return where;
}

/**
 * Helper – same as above but filters on an arbitrary date column
 * (e.g. `date` on appointments, `queueDate` on queue entries).
 */
export function applyDateRange(
  where: Record<string, unknown>,
  query: DateRangeQuery,
  column = 'date',
): Record<string, unknown> {
  if (query.from || query.to) {
    const range: Record<string, Date> = {};
    if (query.from) range.gte = new Date(query.from);
    if (query.to) {
      const end = new Date(query.to);
      end.setUTCDate(end.getUTCDate() + 1);
      range.lt = end;
    }
    where[column] = range;
  }
  return where;
}
