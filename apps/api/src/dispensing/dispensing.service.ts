import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/paginate';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { Dispensing } from '@prisma/client';
import { CreateDispensingDto } from './dto/create-dispensing.dto';
import { UpdateDispensingDto } from './dto/update-dispensing.dto';
import { FindDispensingQueryDto } from './dto/find-dispensing-query.dto';

/**
 * Pharmacy dispensing — track prescription fulfillment and batch information.
 *
 * # SOLID
 * - **Single Responsibility** — only dispensing lifecycle.
 * - **Dependency Inversion** — implements `IBaseService` & `IPaginatable` contracts.
 */
@Injectable()
export class DispensingService
  implements IBaseService<Dispensing, CreateDispensingDto, UpdateDispensingDto>, IPaginatable<Dispensing, FindDispensingQueryDto>
{
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDispensingDto) {
    return this.prisma.dispensing.create({
      data: {
        prescriptionId: dto.prescriptionId,
        medicineId: dto.medicineId,
        medicineName: dto.medicineName,
        quantity: dto.quantity,
        batchNo: dto.batchNo,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        notes: dto.notes,
        dispensedBy: dto.dispensedBy,
      },
      include: { prescription: true },
    });
  }

  async findAll(query: FindDispensingQueryDto): Promise<PaginatedResult<Dispensing>> {
    const where: Record<string, unknown> = {};
    if (query.prescriptionId) where.prescriptionId = query.prescriptionId;
    return paginate(
      () => this.prisma.dispensing.count({ where }),
      ({ skip, take }) =>
        this.prisma.dispensing.findMany({
          where,
          include: { prescription: true },
          orderBy: [{ dispensedAt: 'desc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );
  }

  async findOne(id: string) {
    const dispensing = await this.prisma.dispensing.findUnique({
      where: { id },
      include: { prescription: true },
    });
    if (!dispensing) throw new NotFoundException(`Dispensing ${id} not found`);
    return dispensing;
  }

  async update(id: string, dto: UpdateDispensingDto) {
    await this.findOne(id);
    return this.prisma.dispensing.update({
      where: { id },
      data: {
        ...dto,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.dispensing.delete({ where: { id } });
  }
}
