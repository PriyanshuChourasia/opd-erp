import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApplicationFeaturesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: { code: string; moduleId: string; name: string; description?: string }, userId?: string) {
    return this.prisma.applicationFeature.create({
      data: { ...dto, createdById: userId ?? null },
      include: { module: true },
    });
  }

  async findAll(query: { moduleId?: string } = {}) {
    return this.prisma.applicationFeature.findMany({
      where: query.moduleId ? { moduleId: query.moduleId } : undefined,
      include: { module: { select: { code: true, name: true } } },
      orderBy: [{ code: 'asc' }],
    });
  }

  async findOne(id: string) {
    const feature = await this.prisma.applicationFeature.findUnique({
      where: { id },
      include: { module: true },
    });
    if (!feature) throw new NotFoundException(`Application feature ${id} not found`);
    return feature;
  }

  async remove(id: string) {
    const existing = await this.prisma.applicationFeature.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Application feature ${id} not found`);
    return this.prisma.applicationFeature.delete({ where: { id } });
  }
}