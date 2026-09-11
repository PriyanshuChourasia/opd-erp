import { SetMetadata } from '@nestjs/common';
import { TenantScope } from '../scope.enum';

export const REQUIRE_SCOPE_KEY = 'tenant:requireScope';

/**
 * Declare the security domain an endpoint belongs to.
 *   @RequireScope(TenantScope.PLATFORM) — platform operators only
 *   @RequireScope(TenantScope.TENANT)   — organization-bound users only
 * Defaults to ANY when absent.
 */
export const RequireScope = (scope: TenantScope) =>
    SetMetadata(REQUIRE_SCOPE_KEY, scope);