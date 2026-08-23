import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { FinancialYear } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFinancialYearDto, UpdateFinancialYearDto } from './dto/financial-year.dto';

@Injectable()
export class FinancialYearService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organisationId: string): Promise<FinancialYear[]> {
    return this.prisma.financialYear.findMany({
      where: { organisationId },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: string): Promise<FinancialYear> {
    const fy = await this.prisma.financialYear.findUnique({ where: { id } });
    if (!fy) throw new NotFoundException('Financial year not found');
    return fy;
  }

  async findActive(organisationId: string): Promise<FinancialYear | null> {
    return this.prisma.financialYear.findFirst({
      where: { organisationId, isActive: true },
    });
  }

  async create(dto: CreateFinancialYearDto, organisationId: string, userId?: string): Promise<FinancialYear> {
    // Validate dates
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (start >= end) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Check for overlapping financial years
    const overlap = await this.prisma.financialYear.findFirst({
      where: {
        organisationId,
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } },
        ],
      },
    });
    if (overlap) {
      throw new BadRequestException(`Overlaps with existing financial year: ${overlap.label}`);
    }

    const data: any = {
      organisationId,
      label: dto.label,
      startDate: start,
      endDate: end,
      isActive: dto.isActive ?? false,
      createdById: userId ?? null,
    };

    // If marking as active, deactivate others first
    if (data.isActive) {
      await this.prisma.financialYear.updateMany({
        where: { organisationId, isActive: true },
        data: { isActive: false, updatedById: userId ?? null },
      });
    }

    return this.prisma.financialYear.create({ data });
  }

  async update(id: string, dto: UpdateFinancialYearDto, userId?: string): Promise<FinancialYear> {
    const existing = await this.findOne(id);

    const updateData: any = { updatedById: userId ?? null };
    if (dto.label !== undefined) updateData.label = dto.label;
    if (dto.startDate !== undefined) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) updateData.endDate = new Date(dto.endDate);

    // If marking as active, deactivate others first
    if (dto.isActive === true) {
      await this.prisma.financialYear.updateMany({
        where: { organisationId: existing.organisationId, isActive: true, id: { not: id } },
        data: { isActive: false, updatedById: userId ?? null },
      });
      updateData.isActive = true;
    } else if (dto.isActive === false) {
      updateData.isActive = false;
    }

    return this.prisma.financialYear.update({ where: { id }, data: updateData });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.financialYear.delete({ where: { id } });
  }

  async activate(id: string, userId?: string): Promise<FinancialYear> {
    const existing = await this.findOne(id);

    // Deactivate all others in the same organisation
    await this.prisma.financialYear.updateMany({
      where: { organisationId: existing.organisationId, isActive: true },
      data: { isActive: false, updatedById: userId ?? null },
    });

    return this.prisma.financialYear.update({
      where: { id },
      data: { isActive: true, updatedById: userId ?? null },
    });
  }
}
