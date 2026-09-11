export enum TenantScope {
    /** Platform operators — customers, licenses, plans, organization registry. organizationId is null. */
    PLATFORM = 'PLATFORM',
    /** Any authenticated user bound to an organization (clinic). */
    TENANT = 'TENANT',
    /** Authenticated user, tenant OR platform (e.g. shared reference reads). */
    ANY = 'ANY',
}