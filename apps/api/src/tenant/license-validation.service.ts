import {
    ForbiddenException,
    Injectable,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Single implementation of license entitlement checks for an organization.
 * Called by TenantContextGuard when a handler declares @RequireLicense(...).
 * No other module may duplicate license logic — import this service instead.
 */
@Injectable()
export class LicenseValidationService {
    private readonly logger = new Logger(LicenseValidationService.name);

    constructor(private readonly prisma: PrismaService) {}

    /**
     * Assert the organization holds an ACTIVE, non-expired license and (when
     * featureCode is given) that the license entitles the feature.
     */
    async requireEntitlement(
        organizationId: string,
        featureCode?: string,
    ): Promise<void> {
const license = await this.prisma.license.findFirst({
      where: {
        organizationId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
      include: featureCode
        ? { mappings: { include: { feature: true } } }
        : undefined,
    });

    if (!license) {
      this.logger.warn(
        `License check failed for org=${organizationId} feature=${featureCode ?? 'base'}`,
      );
      throw new ForbiddenException(
        'Your organization does not have an active license for this operation.',
      );
    }

    if (featureCode) {
      const granted = (license as { mappings?: { feature: { code: string } }[] })
        .mappings?.some((m) => m.feature.code === featureCode);
      if (!granted) {
        throw new ForbiddenException(
          `Your license does not include the "${featureCode}" feature.`,
        );
      }
    }
    }
}