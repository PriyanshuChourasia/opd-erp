<?php

namespace Modules\License\Services;

use App\Enums\LicenseStatus;
use App\Models\User;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Modules\License\Models\License;
use Modules\Organization\Models\Organization;

/**
 * Single source of truth for the license access rules (Task 4, step 4.8/4.9).
 *
 * Rules (status alone is never enough — dates are also validated):
 *   CREATED      -> NO normal access (activation-only)
 *   ACTIVE       -> access, but treated as EXPIRED if expiry_date has passed
 *   SUSPENDED    -> NO access
 *   EXPIRED      -> NO access, UNLESS inside the configured grace window
 *   REVOKED      -> NO access
 *
 * Expiry is evaluated DYNAMICALLY (no database write on every request).
 */
class LicenseValidationService
{
    public function __construct(
        private readonly int $gracePeriodDays,
        private readonly AuthFactory $auth,
    ) {
    }

    public function currentEntitlement(): Entitlement
    {
        $user = $this->auth->guard('jwt')->user();

        return $this->entitlementFor($user?->organization);
    }

    public function entitlementFor(?Organization $organization): Entitlement
    {
        if (! $organization) {
            return Entitlement::denied('Your account is not linked to an organization.', 'NO_ORGANIZATION');
        }

        $license = $this->licenseFor($organization);

        if (! $license) {
            return Entitlement::denied('Your organization does not have a subscription on file.', 'NO_LICENSE');
        }

        $status = $license->status;
        $today = now()->startOfDay();
        $startsAt = $license->start_date?->startOfDay();
        $expiresAt = $license->expiry_date?->startOfDay();

        if ($startsAt && $startsAt->gt(now())) {
            return Entitlement::denied('Your subscription is not active yet.', 'NOT_STARTED', $license, $expiresAt);
        }

        if ($status === LicenseStatus::ACTIVE || $status === LicenseStatus::EXPIRED) {
            if ($expiresAt && $expiresAt->lt($today)) {
                return $this->applyGrace($license, $expiresAt);
            }

            if ($status === LicenseStatus::ACTIVE) {
                return Entitlement::full($license, $expiresAt);
            }

            // Explicitly EXPIRED but still within date bounds (should not happen
            // in practice) — treat as expired and apply the grace rule.
            return $this->applyGrace($license, $expiresAt);
        }

        return match ($status) {
            LicenseStatus::SUSPENDED => Entitlement::denied('Your organization subscription is suspended.', 'SUSPENDED', $license, $expiresAt),
            LicenseStatus::REVOKED => Entitlement::denied('Your organization subscription has been revoked.', 'REVOKED', $license, $expiresAt),
            LicenseStatus::CREATED => Entitlement::denied('Your organization subscription has not been activated yet.', 'CREATED', $license, $expiresAt),
            default => Entitlement::denied('Your organization does not have a valid subscription.', 'UNKNOWN', $license, $expiresAt),
        };
    }

    /**
     * Resolve the applicable license for an organization (the most recently
     * issued one). Never derive a license from client-supplied input.
     */
    public function licenseFor(?Organization $organization): ?License
    {
        if (! $organization) {
            return null;
        }

        return $organization->licenses()
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->first();
    }

    /**
     * Returns the license only when the organization is currently entitled to
     * use the application (full or grace access). Convenience for the existing
     * TenantService/validLicense API surface.
     */
    public function validLicenseFor(?Organization $organization): ?License
    {
        $entitlement = $this->entitlementFor($organization);

        return $entitlement->isEntitled() ? $entitlement->license : null;
    }

    private function applyGrace(License $license, \Carbon\Carbon $expiresAt): Entitlement
    {
        if ($this->gracePeriodDays <= 0) {
            return Entitlement::denied('Your organization subscription has expired.', 'EXPIRED', $license, $expiresAt);
        }

        $graceEndsAt = $expiresAt->copy()->addDays($this->gracePeriodDays);

        if (now()->startOfDay()->lte($graceEndsAt)) {
            return Entitlement::grace($license, $graceEndsAt);
        }

        return Entitlement::denied('Your organization subscription has expired.', 'EXPIRED', $license, $expiresAt);
    }
}