import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/utils/paginate';
import type { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { CreateLicensePlanDto } from './dto/create-license-plan.dto';
import { UpdateLicensePlanDto } from './dto/update-license-plan.dto';

@Injectable()
export class LicensePlansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLicensePlanDto, userId?: string) {
    const { features, ...data } = dto;
    return this.prisma.licensePlan.create({
      data: {
        ...data,
        createdById: userId ?? null,
        features: features?.length
          ? { create: features.map((f) => ({ code: f.name.toLowerCase().replace(/\s+/g, '_'), name: f.name, description: f.description })) }
          : undefined,
      },
      include: { features: true },
    });
  }

  async findAll(query: { page?: number; limit?: number } = {}): Promise<PaginatedResult<unknown>> {
    return paginate(
      () => this.prisma.licensePlan.count(),
      ({ skip, take }) =>
        this.prisma.licensePlan.findMany({
          include: { features: true, _count: { select: { licenses: true } } },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );
  }

  async findOne(id: string) {
    const plan = await this.prisma.licensePlan.findUnique({
      where: { id },
      include: { features: true, licenses: true },
    });
    if (!plan) throw new NotFoundException(`License plan ${id} not found`);
    return plan;
  }

  async update(id: string, dto: UpdateLicensePlanDto, userId?: string) {
    const existing = await this.prisma.licensePlan.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`License plan ${id} not found`);
    const { features: _ignored, ...data } = dto; // features managed separately
    return this.prisma.licensePlan.update({
      where: { id },
      data: { ...data, updatedById: userId ?? null },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.licensePlan.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`License plan ${id} not found`);
    return this.prisma.licensePlan.delete({ where: { id } });
  }
}