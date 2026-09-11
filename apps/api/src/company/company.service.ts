import { Injectable } from '@nestjs/common';
import type { Company } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

/**
 * Singleton company profile — a single settings record, not a list.
 *
 * # SOLID
 * - **Single Responsibility** — manages the one company profile record.
 */
@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(organizationId?: string): Promise<Company | null> {
    return this.prisma.company.findFirst({
      where: organizationId
        ? { OR: [{ organizationId }, { organizationId: null }] } // own org + shared global default
        : undefined,
    });
  }

  async upsert(dto: UpdateCompanyDto, userId?: string, organizationId?: string): Promise<Company> {
    const existing = await this.prisma.company.findFirst({
      where: organizationId
        ? { OR: [{ organizationId }, { organizationId: null }] }
        : undefined,
    });

    if (!existing) {
      return this.prisma.company.create({
        data: {
          name: dto.name ?? 'My Clinic',
          address: dto.address,
          phone: dto.phone,
          email: dto.email,
          website: dto.website,
          registrationNumber: dto.registrationNumber,
          registrationFee: dto.registrationFee ?? 100,
          discountEnabled: dto.discountEnabled ?? true,
          maxDiscountPercent: dto.maxDiscountPercent ?? 50,
          defaultDiscountType: dto.defaultDiscountType ?? 'percent',
          organizationId: organizationId ?? null,
          createdById: userId ?? null,
        },
      });
    }

    return this.prisma.company.update({
      where: { id: existing.id },
      data: { ...dto, updatedById: userId ?? null },
    });
  }
}
