import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { IBaseService } from '../common/interfaces/base-service.interface';
import type { Prescription } from '@prisma/client';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';

/**
 * E-prescriptions with medicine selection, dosage tracking, and item management.
 *
 * # SOLID
 * - **Single Responsibility** — only prescription lifecycle and item management.
 * - **Open/Closed** — new item types can be added via DTO without changing core CRUD.
 */
@Injectable()
export class PrescriptionsService implements IBaseService<Prescription, CreatePrescriptionDto, UpdatePrescriptionDto> {
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

  async findAll(patientId?: string) {
    const where: Record<string, unknown> = {};
    if (patientId) where.patientId = patientId;
    return this.prisma.prescription.findMany({
      where,
      include: { items: true, patient: true, doctor: true },
      orderBy: { createdAt: 'desc' },
    });
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
