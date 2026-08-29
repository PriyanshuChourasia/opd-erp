import type { PaginatedResult } from './paginated-result.interface';

/**
 * Generic CRUD interface that all feature services should implement.
 *
 * # SOLID
 * - **Interface Segregation** — each service only implements the methods it needs.
 * - **Dependency Inversion** — controllers depend on service *concepts*, not concrete classes.
 */
export interface IBaseService<T, CreateDto = unknown, UpdateDto = Partial<CreateDto>> {
  create(dto: CreateDto): Promise<T> | T;
  findAll?(...args: unknown[]): Promise<T[] | PaginatedResult<T>> | T[] | PaginatedResult<T>;
  findOne(id: string): Promise<T> | T;
  update(id: string, dto: UpdateDto): Promise<T> | T;
  remove(id: string): Promise<T> | T;
}

/**
 * Service that supports paginated, text-searchable listing.
 * `query` carries `page`/`limit` plus whatever filter fields the module needs.
 */
export interface IPaginatable<T, Query = unknown> {
  findAll(query: Query): Promise<PaginatedResult<T>>;
}
