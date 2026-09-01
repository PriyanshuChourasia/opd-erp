import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/paginate';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { Prescription } from '@prisma/client';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { FindPrescriptionsQueryDto } from './dto/find-prescriptions-query.dto';
import { applyCreatedAtRange } from '../common/dto/date-range-query.dto';

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

  /** Build a JSON snapshot of prescription items for history storage. */
  private buildItemsSnapshot(items: { medicineId: string; medicineName: string; dosage: string; duration?: string | null; instructions?: string | null; quantity: number; refills?: number | null }[]) {
    return items.map((item) => ({
      medicineId: item.medicineId,
      medicineName: item.medicineName,
      dosage: item.dosage,
      duration: item.duration ?? null,
      instructions: item.instructions ?? null,
      quantity: item.quantity,
      refills: item.refills ?? 0,
    }));
  }

  async create(dto: CreatePrescriptionDto, userId?: string) {
    const { items, ...data } = dto;
    const prescription = await this.prisma.prescription.create({
      data: {
        ...data,
        version: 1,
        createdById: userId ?? null,
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

    // Save version 1 history entry
    await this.prisma.prescriptionHistory.create({
      data: {
        prescriptionId: prescription.id,
        version: 1,
        diagnosis: prescription.diagnosis,
        notes: prescription.notes,
        status: prescription.status,
        items: this.buildItemsSnapshot(items),
        changeType: 'CREATE',
        createdById: userId ?? null,
      },
    });

    return prescription;
  }

  async findAll(query: FindPrescriptionsQueryDto, requestingDoctorId?: string): Promise<PaginatedResult<Prescription>> {
    const where: Record<string, unknown> = { deletedAt: null };
    if (query.patientId) where.patientId = query.patientId;
    // A doctor is always scoped to their own prescriptions — the query param
    // is ignored in that case rather than trusted, so a doctor can't page
    // through another doctor's prescriptions by passing a different doctorId.
    if (requestingDoctorId) where.doctorId = requestingDoctorId;
    else if (query.doctorId) where.doctorId = query.doctorId;
    if (query.status) where.status = query.status;
    // Date range: from/to takes priority; fallback to single-day `date`
    if (query.from || query.to) {
      applyCreatedAtRange(where, query);
    } else if (query.date) {
      const dayStart = new Date(Date.UTC(
        new Date(query.date).getUTCFullYear(),
        new Date(query.date).getUTCMonth(),
        new Date(query.date).getUTCDate(),
      ));
      const dayEnd = new Date(dayStart);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
      where.createdAt = { gte: dayStart, lt: dayEnd };
    }
    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
        { patient: { contactNo: { contains: search } } },
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
      where: { id, deletedAt: null },
      include: { items: true, patient: true, doctor: true },
    });
    if (!prescription) throw new NotFoundException(`Prescription ${id} not found`);
    return prescription;
  }

  async update(id: string, dto: UpdatePrescriptionDto, userId?: string, changeReason?: string) {
    const current = await this.findOne(id);
    const newVersion = current.version + 1;
    const { items, ...data } = dto;

    // Build the snapshot of items for this version
    let itemsSnapshot: ReturnType<typeof this.buildItemsSnapshot>;
    if (items) {
      itemsSnapshot = this.buildItemsSnapshot(items);
    } else {
      // No item changes — snapshot the current items
      itemsSnapshot = this.buildItemsSnapshot(current.items);
    }

    // Use a transaction to atomically: save history, update prescription, replace items
    await this.prisma.$transaction(async (tx) => {
      // 1. Save history entry with previous state
      await tx.prescriptionHistory.create({
        data: {
          prescriptionId: id,
          version: newVersion,
          diagnosis: data.diagnosis !== undefined ? data.diagnosis : current.diagnosis,
          notes: data.notes !== undefined ? data.notes : current.notes,
          status: current.status,
          items: itemsSnapshot,
          changeType: 'UPDATE',
          changeReason: changeReason ?? null,
          createdById: userId ?? null,
        },
      });

      // 2. Update prescription metadata + increment version
      const updateData: Record<string, unknown> = { ...data, version: newVersion, updatedById: userId ?? null };
      if (Object.keys(updateData).length > 1) { // more than just version
        await tx.prescription.update({ where: { id }, data: updateData });
      } else {
        await tx.prescription.update({ where: { id }, data: { version: newVersion, updatedById: userId ?? null } });
      }

      // 3. Replace items if provided
      if (items) {
        await tx.prescriptionItem.deleteMany({ where: { prescriptionId: id } });
        await tx.prescriptionItem.createMany({
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
        });
      }
    });

    return this.findOne(id);
  }

  async findHistory(prescriptionId: string) {
    // Verify prescription exists
    await this.findOne(prescriptionId);
    return this.prisma.prescriptionHistory.findMany({
      where: { prescriptionId },
      orderBy: { version: 'desc' },
      include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async remove(id: string, deletedById?: string) {
    await this.findOne(id);
    return this.prisma.prescription.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: deletedById ?? null },
    });
  }
}
