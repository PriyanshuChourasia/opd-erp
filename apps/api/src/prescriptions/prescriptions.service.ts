import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/paginate';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { Prescription } from '@prisma/client';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { FindPrescriptionsQueryDto } from './dto/find-prescriptions-query.dto';

/**
 * E-prescriptions with medicine selection, dosage tracking, and item management.
 *
 * # SOLID
 * - **Single Responsibility** — only prescription lifecycle and item management.
 * - **Open/Closed** — new item types can be added via DTO without changing core CRUD.
 */
@Injectable()
export class PrescriptionsService
  implements
    IBaseService<Prescription, CreatePrescriptionDto, UpdatePrescriptionDto>,
    IPaginatable<Prescription, FindPrescriptionsQueryDto>
{
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePrescriptionDto) {
    const { items, ...data } = dto;
    return this.prisma.prescription.create({
      data: {
        ...data,
        items: {
          create: items.map((item) => ({
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            dosage: item.dosage,
            duration: item.duration,
            instructions: item.instructions,
            quantity: item.quantity,
            refills: item.refills ?? 0,
          })),
        },
      },
      include: { items: true, patient: true, doctor: true },
    });
  }

  async findAll(query: FindPrescriptionsQueryDto): Promise<PaginatedResult<Prescription>> {
    const where: Record<string, unknown> = {};
    if (query.patientId) where.patientId = query.patientId;
    if (query.doctorId) where.doctorId = query.doctorId;
    if (query.status) where.status = query.status;
    if (query.date) {
      const dayStart = new Date(query.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      where.createdAt = { gte: dayStart, lt: dayEnd };
    }
    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { patient: { name: { contains: search, mode: 'insensitive' } } },
        { patient: { phone: { contains: search } } },
        { diagnosis: { contains: search, mode: 'insensitive' } },
      ];
    }
    return paginate(
      () => this.prisma.prescription.count({ where }),
      ({ skip, take }) =>
        this.prisma.prescription.findMany({
          where,
          include: { items: true, patient: true, doctor: true },
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );
  }

  async findOne(id: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: { items: true, patient: true, doctor: true },
    });
    if (!prescription) throw new NotFoundException(`Prescription ${id} not found`);
    return prescription;
  }

  async update(id: string, dto: UpdatePrescriptionDto) {
    await this.findOne(id);
    const { items, ...data } = dto;

    if (items) {
      // Atomic replace: delete existing items and recreate in a single transaction
      await this.prisma.$transaction([
        this.prisma.prescriptionItem.deleteMany({ where: { prescriptionId: id } }),
        this.prisma.prescriptionItem.createMany({
          data: items.map((item) => ({
            prescriptionId: id,
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            dosage: item.dosage,
            duration: item.duration,
            instructions: item.instructions,
            quantity: item.quantity,
            refills: item.refills ?? 0,
          })),
        }),
      ]);
    }

    if (Object.keys(data).length > 0) {
      await this.prisma.prescription.update({ where: { id }, data });
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.prescription.delete({ where: { id } });
  }
}
