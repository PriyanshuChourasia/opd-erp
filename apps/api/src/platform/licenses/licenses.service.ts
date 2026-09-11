import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/utils/paginate';
import type { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { CreateLicenseDto } from './dto/create-license.dto';
import { UpdateLicenseDto } from './dto/update-license.dto';

@Injectable()
export class LicensesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLicenseDto, userId?: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
    });
    if (!org) {
      throw new NotFoundException(`Organization ${dto.organizationId} not found`);
    }
    const plan = await this.prisma.licensePlan.findUnique({ where: { id: dto.planId } });
    if (!plan) throw new NotFoundException(`Plan ${dto.planId} not found`);

    const licenseNumber =
      `LIC-${dto.organizationId.slice(0, 8).toUpperCase()}-` +
      Math.random().toString(36).slice(2, 10).toUpperCase();

    const { features, ...data } = dto;
    const created = await this.prisma.license.create({
      data: {
        ...data,
        licenseNumber,
        createdById: userId ?? null,
        mappings: features?.length
          ? { create: features.map((f) => ({ featureId: f.featureId, value: f.value })) }
          : undefined,
      },
      include: { mappings: { include: { feature: true } } },
    });
    return created;
  }

  async findAll(query: { page?: number; limit?: number; orgId?: string } = {}): Promise<PaginatedResult<unknown>> {
    const where: Record<string, unknown> = {};
    if (query.orgId) where.organizationId = query.orgId;
    return paginate(
      () => this.prisma.license.count({ where }),
      ({ skip, take }) =>
        this.prisma.license.findMany({
          where,
          include: {
            plan: { select: { name: true, code: true } },
            organization: { select: { name: true, code: true } },
            mappings: { include: { feature: true } },
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );
  }

  async findOne(id: string) {
    const license = await this.prisma.license.findUnique({
      where: { id },
      include: {
        plan: true,
        organization: true,
        customer: true,
        mappings: { include: { feature: true } },
        renewals: true,
      },
    });
    if (!license) throw new NotFoundException(`License ${id} not found`);
    return license;
  }

  async update(id: string, dto: UpdateLicenseDto, userId?: string) {
    const existing = await this.prisma.license.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`License ${id} not found`);

    const { features, ...data } = dto;
    if (features) {
      await this.prisma.licenseFeatureMapping.deleteMany({ where: { licenseId: id } });
      await this.prisma.licenseFeatureMapping.createMany({
        data: features.map((f) => ({ licenseId: id, featureId: f.featureId, value: f.value })),
      });
    }
    return this.prisma.license.update({
      where: { id },
      data: { ...data, updatedById: userId ?? null },
      include: { mappings: { include: { feature: true } } },
    });
  }

  async revoke(id: string) {
    const existing = await this.prisma.license.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`License ${id} not found`);
    if (existing.status === 'CANCELLED') {
      throw new ConflictException(`License ${id} is already cancelled`);
    }
    return this.prisma.license.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}