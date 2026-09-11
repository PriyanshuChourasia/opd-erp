import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/utils/paginate';
import type { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { CreateApplicationModuleDto } from './dto/create-application-module.dto';

@Injectable()
export class ApplicationModulesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateApplicationModuleDto, userId?: string) {
    const { features, ...data } = dto;
    return this.prisma.applicationModule.create({
      data: {
        ...data,
        createdById: userId ?? null,
        features: features?.length ? { create: features } : undefined,
      },
      include: { features: true },
    });
  }

  async findAll(query: { page?: number; limit?: number } = {}): Promise<PaginatedResult<unknown>> {
    return paginate(
      () => this.prisma.applicationModule.count(),
      ({ skip, take }) =>
        this.prisma.applicationModule.findMany({
          include: { features: true, _count: { select: { permissionLinks: true } } },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );
  }

  async findOne(id: string) {
    const module = await this.prisma.applicationModule.findUnique({
      where: { id },
      include: { features: true, permissionLinks: { include: { permission: true } } },
    });
    if (!module) throw new NotFoundException(`Application module ${id} not found`);
    return module;
  }

  async remove(id: string) {
    const existing = await this.prisma.applicationModule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Application module ${id} not found`);
    return this.prisma.applicationModule.delete({ where: { id } });
  }
}