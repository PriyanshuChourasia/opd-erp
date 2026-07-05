import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { IBaseService } from '../common/interfaces/base-service.interface';
import type { LabOrder } from '@prisma/client';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { UpdateLabOrderDto } from './dto/update-lab-order.dto';

/**
 * Lab test ordering, result recording, and status tracking.
 *
 * # SOLID
 * - **Single Responsibility** — only lab order lifecycle and result management.
 * - **Interface Segregation** — custom `update` signature for status+result without
 *   forcing a full CRUD pattern on callers.
 */
@Injectable()
export class LabOrdersService implements IBaseService<LabOrder, CreateLabOrderDto, UpdateLabOrderDto> {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLabOrderDto) {
    return this.prisma.labOrder.create({
      data: dto,
      include: { patient: true, doctor: true },
    });
  }

  async findAll(filters: { patientId?: string; status?: string }) {
    const where: Record<string, unknown> = {};
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.status) where.status = filters.status;
    return this.prisma.labOrder.findMany({
      where,
      include: { patient: true, doctor: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.labOrder.findUnique({
      where: { id },
      include: { patient: true, doctor: true },
    });
    if (!order) throw new NotFoundException(`Lab order ${id} not found`);
    return order;
  }

  async update(id: string, dto: UpdateLabOrderDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = { ...dto };
    if (dto.resultDate) data.resultDate = new Date(dto.resultDate);
    return this.prisma.labOrder.update({
      where: { id },
      data,
      include: { patient: true, doctor: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.labOrder.delete({ where: { id } });
  }
}
