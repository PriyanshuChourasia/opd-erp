import type { TenantScope } from './scope.enum';

/**
 * The normalized, authenticated tenant context attached to every request by
 * TenantContextGuard. Derives the organization from the JWT-verified user —
 * NEVER from a client-supplied organization_id.
 */
export interface TenantContext {
    userId: string;
    username?: string;
    email?: string;
    roleId: string;
    roleName: string;
    /** Tenant boundary. null means the caller is platform-scoped. */
    organizationId: string | null;
    scope: TenantScope;
    /** Legacy permission strings, e.g. "read:users". */
    permissions: string[];
    /** Canonical dotted permission strings, e.g. "users.view". */
    permissionSlugs: string[];
    userableType?: string | null;
    userableId?: string | null;
}