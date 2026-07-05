/**
 * Generic CRUD interface that all feature services should implement.
 *
 * # SOLID
 * - **Interface Segregation** — each service only implements the methods it needs.
 * - **Dependency Inversion** — controllers depend on service *concepts*, not concrete classes.
 */
export interface IBaseService<T, CreateDto = unknown, UpdateDto = Partial<CreateDto>> {
  create(dto: CreateDto): Promise<T> | T;
  findAll?(...args: unknown[]): Promise<T[]> | T[];
  findOne(id: string): Promise<T> | T;
  update(id: string, dto: UpdateDto): Promise<T> | T;
  remove(id: string): Promise<T> | T;
}

/**
 * Service that supports text-based search.
 * The `search` param is a free-form string that the implementation
 * decides how to apply (name, phone, email, etc.).
 */
export interface ISearchable<T> {
  findAll(search?: string): Promise<T[]>;
}
