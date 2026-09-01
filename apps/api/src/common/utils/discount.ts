import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';

/**
 * Resolves a `discountRuleId` into the actual rupee discount for a bill,
 * validating the rule is active and within its optional date window.
 * Throws rather than silently ignoring an invalid/expired rule, so a stale
 * client selection surfaces as an honest error instead of a wrong total.
 */
export async function resolveDiscount(
  prisma: PrismaService,
  discountRuleId: string | undefined,
  subtotal: number,
): Promise<{ discount: number; discountRuleId: string | null }> {
  if (!discountRuleId) return { discount: 0, discountRuleId: null };

  const rule = await prisma.discountRule.findUnique({ where: { id: discountRuleId, deletedAt: null } });
  if (!rule || !rule.isActive) {
    throw new BadRequestException('Selected discount is no longer available');
  }
  const now = new Date();
  if ((rule.validFrom && now < rule.validFrom) || (rule.validTo && now > rule.validTo)) {
    throw new BadRequestException(`Discount "${rule.name}" is not valid on this date`);
  }

  const discount = rule.type === 'PERCENTAGE' ? Math.round((subtotal * rule.value) / 100) : Math.min(rule.value, subtotal);
  return { discount, discountRuleId: rule.id };
}
