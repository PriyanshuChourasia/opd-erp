import type { PaginationQueryDto } from '../dto/pagination-query.dto';
import type { PaginatedResult } from '../interfaces/paginated-result.interface';

/**
 * Runs a count + a page-scoped find in parallel and wraps the result in the
 * shared `{ data, meta }` envelope every list endpoint returns.
 */
export async function paginate<T>(
  count: () => Promise<number>,
  find: (args: { skip: number; take: number }) => Promise<T[]>,
  query: PaginationQueryDto,
): Promise<PaginatedResult<T>> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const [total, data] = await Promise.all([count(), find({ skip, take: limit })]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
