import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { IBaseService } from '../common/interfaces/base-service.interface';
import type { ProcedureOrder } from '@prisma/client';
import { CreateProcedureOrderDto } from './dto/create-procedure-order.dto';
import { UpdateProcedureOrderDto } from './dto/update-procedure-order.dto';

/**
 * Medical procedure ordering, scheduling, and result tracking.
 *
 * # SOLID
 * - **Single Responsibility** — only procedure order lifecycle and result management.
 */
@Injectable()
export class ProcedureOrdersService implements IBaseService<ProcedureOrder, CreateProcedureOrderDto, UpdateProcedureOrderDto> {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProcedureOrderDto, userId?: string) {
    return this.prisma.procedureOrder.create({
      data: { ...dto, createdById: userId ?? null },
      include: { patient: true, doctor: true },
    });
  }

  async findAll(filters: { patientId?: string; status?: string }) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.status) where.status = filters.status;
    return this.prisma.procedureOrder.findMany({
      where,
      include: { patient: true, doctor: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.procedureOrder.findUnique({
      where: { id, deletedAt: null },
      include: { patient: true, doctor: true },
    });
    if (!order) throw new NotFoundException(`Procedure order ${id} not found`);
    return order;
  }

  async update(id: string, dto: UpdateProcedureOrderDto, userId?: string) {
    await this.findOne(id);
    const data: Record<string, unknown> = { ...dto, updatedById: userId ?? null };
    if (dto.resultDate) data.resultDate = new Date(dto.resultDate);
    return this.prisma.procedureOrder.update({
      where: { id },
      data,
      include: { patient: true, doctor: true },
    });
  }

  async remove(id: string, deletedById?: string) {
    await this.findOne(id);
    return this.prisma.procedureOrder.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: deletedById ?? null },
    });
  }
}
