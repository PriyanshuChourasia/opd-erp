import { Injectable } from '@nestjs/common';
import type { Organisation } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';

/**
 * Singleton organisation profile — a single settings record, not a list.
 *
 * # SOLID
 * - **Single Responsibility** — manages the one organisation profile record.
 */
@Injectable()
export class OrganisationService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(): Promise<Organisation | null> {
    return this.prisma.organisation.findFirst();
  }

  async upsert(dto: UpdateOrganisationDto): Promise<Organisation> {
    const existing = await this.prisma.organisation.findFirst();

    if (!existing) {
      return this.prisma.organisation.create({
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
        },
      });
    }

    return this.prisma.organisation.update({
      where: { id: existing.id },
      data: dto,
    });
  }
}
