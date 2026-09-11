import { SetMetadata } from '@nestjs/common';

export const REQUIRE_LICENSE_KEY = 'tenant:requireLicense';

/**
 * Gate an endpoint behind the organization's license entitlement.
 *   @RequireLicense('ACCOUNTING')
 * The feature code must be seeded in LicenseFeature and granted via
 * LicenseFeatureMapping on the organization's active license.
 */
export const RequireLicense = (featureCode: string) =>
    SetMetadata(REQUIRE_LICENSE_KEY, featureCode);