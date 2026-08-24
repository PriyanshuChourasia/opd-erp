import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { FinancialYear } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFinancialYearDto, UpdateFinancialYearDto } from './dto/financial-year.dto';

@Injectable()
export class FinancialYearService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve the singleton organisation id (mirrors OrganisationService's
   * singleton convention). The User/JWT payload carries no organisationId.
   */
  private async resolveOrganisationId(userId?: string): Promise<string> {
    const existing = await this.prisma.organisation.findFirst();
    if (existing) return existing.id;
    const created = await this.prisma.organisation.create({
      data: { name: 'My Clinic', createdById: userId ?? null },
    });
    return created.id;
  }

  async findAll(): Promise<FinancialYear[]> {
    return this.prisma.financialYear.findMany({
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: string): Promise<FinancialYear> {
    const fy = await this.prisma.financialYear.findUnique({ where: { id } });
    if (!fy) throw new NotFoundException('Financial year not found');
    return fy;
  }

  async findActive(): Promise<FinancialYear | null> {
    return this.prisma.financialYear.findFirst({
      where: { isActive: true },
    });
  }

  /**
   * Derive a label from the period start (Indian FY runs Apr–Mar),
   * e.g. a start in 2026-04 → "FY 2026-27", start in 2026-02 → "FY 2025-26".
   */
  private deriveFyLabel(start: Date): string {
    const base =
      start.getUTCMonth() >= 3 ? start.getUTCFullYear() : start.getUTCFullYear() - 1;
    return `FY ${base}-${String((base + 1) % 100).padStart(2, '0')}`;
  }

  private fmtDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private async assertNoDuplicate(
    start: Date,
    end: Date,
    label: string,
    excludeId?: string,
  ): Promise<void> {
    const overlap = await this.prisma.financialYear.findFirst({
      where: {
        startDate: { lte: end },
        endDate: { gte: start },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (overlap) {
      throw new BadRequestException(
        `Period already covered by "${overlap.label}" (${this.fmtDate(overlap.startDate)} to ${this.fmtDate(overlap.endDate)})`,
      );
    }

    const sameLabel = await this.prisma.financialYear.findFirst({
      where: { label: { equals: label, mode: 'insensitive' }, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    if (sameLabel) {
      throw new BadRequestException(`A financial year named "${sameLabel.label}" already exists`);
    }
  }

  async create(dto: CreateFinancialYearDto, userId?: string): Promise<FinancialYear> {
    // Validate dates
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid start or end date');
    }
    if (start >= end) {
      throw new BadRequestException('Start date must be before end date');
    }

    const label = dto.label?.trim() || this.deriveFyLabel(start);
    await this.assertNoDuplicate(start, end, label);

    const organisationId = await this.resolveOrganisationId(userId);

    const data: any = {
      organisationId,
      label,
      startDate: start,
      endDate: end,
      isActive: dto.isActive ?? false,
      createdById: userId ?? null,
    };

    // If marking as active, deactivate others first
    if (data.isActive) {
      await this.prisma.financialYear.updateMany({
        where: { isActive: true },
        data: { isActive: false, updatedById: userId ?? null },
      });
    }

    return this.prisma.financialYear.create({ data });
  }

  async update(id: string, dto: UpdateFinancialYearDto, userId?: string): Promise<FinancialYear> {
    const existing = await this.findOne(id);

    const nextStart = dto.startDate !== undefined ? new Date(dto.startDate) : existing.startDate;
    const nextEnd = dto.endDate !== undefined ? new Date(dto.endDate) : existing.endDate;
    if (isNaN(nextStart.getTime()) || isNaN(nextEnd.getTime())) {
      throw new BadRequestException('Invalid start or end date');
    }
    if (nextStart >= nextEnd) {
      throw new BadRequestException('Start date must be before end date');
    }

    const labelChanged = dto.label !== undefined && dto.label.trim() !== existing.label;
    if (labelChanged || dto.startDate !== undefined || dto.endDate !== undefined) {
      await this.assertNoDuplicate(nextStart, nextEnd, dto.label?.trim() ?? existing.label, id);
    }

    const updateData: any = { updatedById: userId ?? null };
    if (dto.label !== undefined) updateData.label = dto.label.trim();
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
    await this.findOne(id);

    // Deactivate all others first
    await this.prisma.financialYear.updateMany({
      where: { isActive: true, id: { not: id } },
      data: { isActive: false, updatedById: userId ?? null },
    });

    return this.prisma.financialYear.update({
      where: { id },
      data: { isActive: true, updatedById: userId ?? null },
    });
  }
}
