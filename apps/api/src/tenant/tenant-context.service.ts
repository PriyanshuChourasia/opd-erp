import {
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { TenantScope } from './scope.enum';
import type { TenantContext } from './tenant-context.interface';
import { normalizePermissionToDot } from './permission.util';

/**
 * Request-scoped symbol under which the resolved TenantContext is cached.
 * Keyed per request object so resolve is computed at most once per request.
 */
const TENANT_CONTEXT_KEY = Symbol('tenantContext');

/** Auth user shape produced by JwtStrategy (also carries organizationId). */
export interface AuthUser {
    id: string;
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    roleId: string;
    roleName: string;
    organizationId?: string | null;
    permissions?: string[];
    permissionSlugs?: string[];
    userableId?: string | null;
    userableType?: string | null;
}

/** Minimal request shape consumed by tenant resolution (Nest @Req() input). */
export interface RequestLike {
    user?: AuthUser;
    [key: symbol]: unknown;
}

/**
 * Central tenant resolution. The organization is ALWAYS derived from the
 * authenticated user (JWT-verified) — never from a request body/query value.
 *
 * Flow: JWT → Authenticated User → TenantContext → Organization → License.
 */
@Injectable()
export class TenantContextService {
    /**
     * Build (or retrieve the cached) TenantContext for a request whose
     * `request.user` was produced by JwtStrategy.
     */
    resolveFromRequest(request: RequestLike): TenantContext {
        const existing = request[TENANT_CONTEXT_KEY] as
            | TenantContext
            | undefined;
        if (existing) return existing;

        const user = request.user;
        if (!user?.id) {
            throw new UnauthorizedException('No authenticated user found.');
        }

        const context = this.fromAuthUser(user);
        request[TENANT_CONTEXT_KEY] = context;
        return context;
    }

    /** Build a TenantContext directly from the JWT-verified auth user. */
    fromAuthUser(user: AuthUser): TenantContext {
        const organizationId = user.organizationId ?? null;
        const permissions = Array.isArray(user.permissions) ? user.permissions : [];
        const permissionSlugs = Array.isArray(user.permissionSlugs)
            ? user.permissionSlugs
            : permissions.map(normalizePermissionToDot);

        return {
            userId: user.id,
            username: user.username,
            email: user.email,
            roleId: user.roleId,
            roleName: user.roleName,
            organizationId,
            scope: organizationId ? TenantScope.TENANT : TenantScope.PLATFORM,
            permissions,
            permissionSlugs: Array.from(new Set(permissionSlugs)),
            userableId: user.userableId ?? null,
            userableType: user.userableType ?? null,
        };
    }

    /** Resolve the context for a request or throw 401 when unauthenticated. */
    getContext(request: RequestLike): TenantContext {
        return this.resolveFromRequest(request);
    }

    /**
     * Resolve the owning organization of the authenticated caller.
     * Throws 403 when the caller is not bound to an organization.
     */
    requireOrganization(request: RequestLike): string {
        const context = this.resolveFromRequest(request);
        if (!context.organizationId) {
            throw new ForbiddenException(
                'This operation requires an organization scope. Your account is not bound to any tenant.',
            );
        }
        return context.organizationId;
    }

    /** Convenience: whether the authenticated caller is tenant-scoped. */
    isTenantUser(request: RequestLike): boolean {
        const context = this.resolveFromRequest(request);
        return !!context.organizationId;
    }

    /**
     * Assert the authenticated caller is platform-scoped (organizationId === null).
     * Used to gate platform endpoints (customers, licenses, plans, org registry).
     */
    requirePlatform(request: RequestLike): void {
        const context = this.resolveFromRequest(request);
        if (context.organizationId) {
            throw new ForbiddenException(
                'This is a platform-level operation and cannot be performed by a tenant account.',
            );
        }
    }
}