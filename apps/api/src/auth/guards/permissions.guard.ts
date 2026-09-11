import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { normalizePermissionToDot } from '../../tenant/permission.util';
import { TenantContextService } from '../../tenant/tenant-context.service';

/**
 * Guard that checks whether the authenticated user has all of
 * the required permissions for the decorated endpoint.
 *
 * Accepts both the legacy "action:resource" form and the canonical
 * "module.action" (e.g. "users.view") form — both are normalized to the
 * canonical dotted form before comparison, so the two styles can be mixed.
 *
 * Permissions come from the JWT-verified user (request.user), never from the
 * request body. Falls through (allows) when no @Permissions() decorator is present.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tenantContext: TenantContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No permissions required — allow everyone through
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest();

    this.tenantContext.resolveFromRequest(request);

    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('No user found for this request');
    }

    // Permissions already loaded by JwtStrategy into request.user
    const userPermissions: string[] = user.permissions ?? [];
    const userPermissionSlugs: string[] = user.permissionSlugs ?? [];

    // Accepted identifiers = legacy "action:resource" + canonical "module.action"
    const allowed = new Set<string>(
      userPermissions.map(normalizePermissionToDot),
    );
    for (const slug of userPermissionSlugs) {
      allowed.add(normalizePermissionToDot(slug));
    }

    const hasAll = requiredPermissions.every((perm) =>
      allowed.has(normalizePermissionToDot(perm)),
    );

    if (!hasAll) {
      const missing = requiredPermissions
        .filter((p) => !allowed.has(normalizePermissionToDot(p)))
        .map(normalizePermissionToDot);
      throw new ForbiddenException(
        `Missing required permissions: ${missing.join(', ')}`,
      );
    }

    return true;
  }
}
