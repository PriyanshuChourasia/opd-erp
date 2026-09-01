<?php

namespace Modules\Organization\Services;

use App\Models\User;
use Modules\License\Models\License;
use Modules\Organization\Models\Organization;

class TenantService
{
    /**
     * Resolve the organization for the given user (or the authenticated user
     * when none is provided).
     */
    public function organizationFor(?User $user = null): ?Organization
    {
        $user = $user ?? auth('jwt')->user();

        if (! $user) {
            return null;
        }

        return $user->organization;
    }

    /**
     * Resolve the active license for the given organization.
     */
    public function licenseFor(?Organization $organization): ?License
    {
        if (! $organization) {
            return null;
        }

        return $organization->licenses()
            ->orderByDesc('id')
            ->first();
    }

    /**
     * Validate whether the given license currently entitles the organization
     * to use the software. Returns the license when valid, otherwise null.
     */
    public function validLicense(?Organization $organization): ?License
    {
        $license = $this->licenseFor($organization);

        if (! $license) {
            return null;
        }

        if ($license->status !== License::STATUS_ACTIVE) {
            return null;
        }

        if ($license->expiry_date && $license->expiry_date->lt(now()->startOfDay())) {
            return null;
        }

        return $license;
    }
}
