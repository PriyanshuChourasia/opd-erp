<?php

namespace Modules\License\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\License\Services\Entitlement;
use Modules\Organization\Services\TenantContext;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * License middleware (Task 4, step 4.16).
 *
 * Intentionally narrow: it only answers the question
 * "is this organization currently entitled to use the application?".
 *
 * Role/permission authorization is a separate concern and must NOT be handled
 * here. It runs AFTER authentication (`auth:jwt`), so the surrounding route
 * middleware order is: authenticate -> resolve user -> resolve organization ->
 * validate license -> authorize permission -> controller.
 */
class EnsureLicenseIsActive
{
    public function __construct(private readonly TenantContext $context)
    {
    }

    public function handle(Request $request, Closure $next): mixed
    {
        $entitlement = $this->context->entitlement();

        // Make the resolved license + entitlement available to downstream code
        // without forcing another resolution.
        $request->attributes->set('tenant.entitlement', $entitlement);
        $request->attributes->set('tenant.license', $entitlement->license);
        $request->attributes->set('tenant.access_level', $entitlement->level);

        if (! $entitlement->isEntitled()) {
            throw new HttpException(403, $this->forbiddenMessage($entitlement));
        }

        return $next($request);
    }

    private function forbiddenMessage(Entitlement $entitlement): string
    {
        return match ($entitlement->reasonCode) {
            'SUSPENDED' => 'Your organization subscription is suspended. Contact support.',
            'REVOKED' => 'Your organization subscription has been revoked. Contact support.',
            'EXPIRED', 'EXPIRED_GRACE' => 'Your organization subscription has expired. Please renew it to continue.',
            'CREATED' => 'Your organization subscription has not been activated yet.',
            'NO_LICENSE' => 'Your organization does not have a subscription on file.',
            default => 'Your organization does not have an active subscription to access this resource.',
        };
    }
}