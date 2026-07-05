import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { IBaseService } from '../common/interfaces/base-service.interface';
import type { RadiologyOrder } from '@prisma/client';
import { CreateRadiologyOrderDto } from './dto/create-radiology-order.dto';
import { UpdateRadiologyOrderDto } from './dto/update-radiology-order.dto';

/**
 * Radiology/imaging test ordering, result recording, and status tracking.
 *
 * # SOLID
 * - **Single Responsibility** — only radiology order lifecycle and result management.
 */
@Injectable()
export class RadiologyOrdersService implements IBaseService<RadiologyOrder, CreateRadiologyOrderDto, UpdateRadiologyOrderDto> {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRadiologyOrderDto) {
    return this.prisma.radiologyOrder.create({
      data: dto,
      include: { patient: true, doctor: true },
    });
  }

  async findAll(filters: { patientId?: string; status?: string }) {
    const where: Record<string, unknown> = {};
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.status) where.status = filters.status;
    return this.prisma.radiologyOrder.findMany({
      where,
      include: { patient: true, doctor: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.radiologyOrder.findUnique({
      where: { id },
      include: { patient: true, doctor: true },
    });
    if (!order) throw new NotFoundException(`Radiology order ${id} not found`);
    return order;
  }

  async update(id: string, dto: UpdateRadiologyOrderDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = { ...dto };
    if (dto.resultDate) data.resultDate = new Date(dto.resultDate);
    return this.prisma.radiologyOrder.update({
      where: { id },
      data,
      include: { patient: true, doctor: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.radiologyOrder.delete({ where: { id } });
  }
}
