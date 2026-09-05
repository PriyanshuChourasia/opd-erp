<?php

namespace Modules\Organization\Services;

use App\Models\User;
use Modules\License\Models\License;
use Modules\License\Services\LicenseValidationService;
use Modules\Organization\Models\Organization;

/**
 * @deprecated Back-compat facade around LicenseValidationService. Prefer
 *             TenantContext + LicenseValidationService for new code.
 */
class TenantService
{
    public function __construct(private readonly LicenseValidationService $licenses)
    {
    }

    /**
     * Resolve the organization for the given user (or the authenticated user
     * when none is provided). Never derived from request parameters.
     */
    public function organizationFor(?User $user = null): ?Organization
    {
        return $user?->organization;
    }

    /**
     * Resolve the applicable license for the given organization.
     */
    public function licenseFor(?Organization $organization): ?License
    {
        return $this->licenses->licenseFor($organization);
    }

    /**
     * Returns the license when it currently entitles the organization to use
     * the software (full or grace access), otherwise null.
     */
    public function validLicense(?Organization $organization): ?License
    {
        return $this->licenses->validLicenseFor($organization);
    }
}