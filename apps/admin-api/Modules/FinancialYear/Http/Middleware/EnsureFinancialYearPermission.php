<?php

namespace Modules\FinancialYear\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\Organization\Services\TenantContext;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Financial Year permission middleware.
 *
 * Resolves the authenticated user and answers the question
 * "does this user hold the required financial-year permission?".
 *
 * Permission slugs are resolved through the Task 4 authorization foundation
 * (AuthorizationService + Gate) — never hard-coded role names.
 */
class EnsureFinancialYearPermission
{
    public function __construct(private readonly TenantContext $context)
    {
    }

    public function handle(Request $request, Closure $next, string $permissionSlug): mixed
    {
        $user = $this->context->user();

        if (! $user || ! $user->can($permissionSlug)) {
            throw new HttpException(403, "You do not have the '{$permissionSlug}' permission.");
        }

        $request->attributes->set('tenant.permission', $permissionSlug);

        return $next($request);
    }
}
