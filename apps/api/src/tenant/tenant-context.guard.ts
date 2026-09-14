import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LicenseValidationService } from './license-validation.service';
import { TenantContextService, RequestLike } from './tenant-context.service';
import { TenantScope } from './scope.enum';
import {
    REQUIRE_LICENSE_KEY,
} from './decorators/require-license.decorator';
import {
    REQUIRE_SCOPE_KEY,
} from './decorators/require-scope.decorator';

/**
 * Tenant resolution guard. Runs AFTER JwtAuthGuard and:
 *   1. resolves the TenantContext from the authenticated user (never the body),
 *   2. enforces the declared {scope} (PLATFORM vs TENANT) boundary,
 *   3. enforces the declared license {feature} entitlement when present.
 * The resolved context is cached on the request object for the whole pipeline.
 */
@Injectable()
export class TenantContextGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly tenantContext: TenantContextService,
        private readonly licenseValidation: LicenseValidationService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<RequestLike>();

        const tenantContext = this.tenantContext.resolveFromRequest(request);

        const requiredScope = this.reflector.getAllAndOverride<TenantScope | undefined>(
            REQUIRE_SCOPE_KEY,
            [context.getHandler(), context.getClass()],
        );

        // Developer is deliberately org-bound (so the full clinic app works for
        // it) while also retaining platform-level tooling access — exempt it
        // from the "tenant accounts can't reach platform endpoints" rule that
        // every other org-bound role is still subject to.
        if (
            requiredScope === TenantScope.PLATFORM &&
            tenantContext.organizationId &&
            tenantContext.roleName !== 'Developer'
        ) {
            throw new ForbiddenException(
                'This is a platform-level operation. Tenant accounts cannot access it.',
            );
        }

        if (requiredScope === TenantScope.TENANT && !tenantContext.organizationId) {
            throw new ForbiddenException(
                'This operation requires an organization scope.',
            );
        }

        const requiredFeature = this.reflector.getAllAndOverride<string | undefined>(
            REQUIRE_LICENSE_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (requiredFeature && tenantContext.organizationId) {
            await this.licenseValidation.requireEntitlement(
                tenantContext.organizationId,
                requiredFeature,
            );
        }

        return true;
    }
}