<?php

namespace Modules\Organization\Services;

use App\Models\User;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Modules\License\Models\License;
use Modules\License\Services\Entitlement;
use Modules\License\Services\LicenseValidationService;
use Modules\Organization\Models\Organization;

/**
 * Central tenant/security context (Task 4, step 4.13).
 *
 * The current security context is ALWAYS derived from the authenticated user's
 * own relationships — never from client-supplied request parameters:
 *
 *     authenticated user -> organization -> license
 *
 * Controllers, middleware and services use this instead of trusting
 * `organization_id` / `license_id` / `user_id` from the request.
 */
class TenantContext
{
    public function __construct(
        private readonly LicenseValidationService $licenses,
        private readonly AuthFactory $auth,
    ) {
    }

    public function user(): ?User
    {
        return $this->auth->guard('jwt')->user();
    }

    public function organization(): ?Organization
    {
        return $this->user()?->organization;
    }

    public function license(): ?License
    {
        return $this->licenseForOrganization($this->organization());
    }

    public function entitlement(): Entitlement
    {
        return $this->licenses->entitlementFor($this->organization());
    }

    private function licenseForOrganization(?Organization $organization): ?License
    {
        return $this->licenses->licenseFor($organization);
    }
}