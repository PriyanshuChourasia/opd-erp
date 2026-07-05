import type { Prisma } from '@prisma/client';

/**
 * Builds Prisma `where` clauses for text-based search across multiple fields.
 *
 * Eliminates the duplicated `OR: [{ name: { contains: … } }, …]` pattern
 * that was repeated verbatim in every service.
 *
 * # SOLID
 * - **Single Responsibility** — this class only builds search filters.
 * - **Open/Closed** — add new searchable fields without touching the service logic.
 *
 * @example
 * ```ts
 * const where = SearchQueryBuilder.search('john', [
 *   'name', 'email',
 *   { field: 'phone', mode: undefined },  // phone is case-sensitive
 * ]);
 * ```
 */
export class SearchQueryBuilder {
  /**
   * Build a Prisma `where` clause that ORs multiple field searches.
   *
   * @param search  The raw search string (empty → returns `undefined` = no filter).
   * @param fields  Field descriptors. A plain string uses `contains` + `insensitive`.
   *                Pass an object to control case sensitivity per field.
   */
  static search(
    search: string | undefined,
    fields: (string | { field: string; mode?: Prisma.QueryMode | undefined })[],
  ): Record<string, unknown> | undefined {
    if (!search) return undefined;

    const conditions = fields.map((f) => {
      const fieldName = typeof f === 'string' ? f : f.field;
      const mode = typeof f === 'object' ? f.mode : 'insensitive';

      const cond: Record<string, unknown> = {
        contains: search,
      };
      if (mode) cond.mode = mode;

      return { [fieldName]: cond };
    });

    return { OR: conditions };
  }
}
