import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/paginate';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { PatientAllergyRecord } from '@prisma/client';
import { CreatePatientAllergyRecordDto } from './dto/create-patient-allergy-record.dto';
import { UpdatePatientAllergyRecordDto } from './dto/update-patient-allergy-record.dto';

/**
 * Patient-specific allergy records — tracks what a patient is allergic to,
 * their reactions, severity, and current status.
 *
 * # SOLID
 * - **Single Responsibility** — only patient allergy record lifecycle.
 * - **Open/Closed** — new allergy types or severity levels can be added
 *   without modifying core CRUD logic.
 */
@Injectable()
export class PatientAllergyRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new allergy record for a patient.
   */
  async create(dto: CreatePatientAllergyRecordDto, userId?: string) {
    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({ where: { id: dto.patientId } });
    if (!patient) throw new NotFoundException(`Patient ${dto.patientId} not found`);

    return this.prisma.patientAllergyRecord.create({
      data: {
        patientId: dto.patientId,
        allergen: dto.allergen,
        allergyType: dto.allergyType ?? null,
        reaction: dto.reaction ?? null,
        severity: dto.severity ?? null,
        status: dto.status ?? 'ACTIVE',
        notes: dto.notes ?? null,
        createdById: userId ?? null,
      },
      include: { patient: { select: { id: true, firstName: true, lastName: true, patientCode: true } } },
    });
  }

  /**
   * Get all allergy records for a patient.
   */
  async findByPatient(
    patientId: string,
    options?: { status?: string; page?: number; limit?: number },
  ): Promise<PaginatedResult<PatientAllergyRecord>> {
    const where: Record<string, unknown> = { patientId };
    if (options?.status) where.status = options.status;

    return paginate(
      () => this.prisma.patientAllergyRecord.count({ where }),
      ({ skip, take }) =>
        this.prisma.patientAllergyRecord.findMany({
          where,
          orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
          skip,
          take,
          include: { patient: { select: { id: true, firstName: true, lastName: true, patientCode: true } } },
        }),
      { page: options?.page ?? 1, limit: options?.limit ?? 50 },
    );
  }

  /**
   * Get a single allergy record by ID.
   */
  async findOne(id: string) {
    const record = await this.prisma.patientAllergyRecord.findUnique({
      where: { id },
      include: { patient: { select: { id: true, firstName: true, lastName: true, patientCode: true } } },
    });
    if (!record) throw new NotFoundException(`Patient allergy record ${id} not found`);
    return record;
  }

  /**
   * Update an allergy record (e.g., change status from ACTIVE to RESOLVED).
   */
  async update(id: string, dto: UpdatePatientAllergyRecordDto, userId?: string) {
    await this.findOne(id);

    return this.prisma.patientAllergyRecord.update({
      where: { id },
      data: {
        ...dto,
        updatedById: userId ?? null,
      },
      include: { patient: { select: { id: true, firstName: true, lastName: true, patientCode: true } } },
    });
  }

  /**
   * Soft-delete: set status to INACTIVE instead of removing the record.
   */
  async remove(id: string, userId?: string) {
    await this.findOne(id);
    return this.prisma.patientAllergyRecord.update({
      where: { id },
      data: { status: 'INACTIVE', updatedById: userId ?? null },
    });
  }

  /**
   * Get active allergies count per patient (useful for dashboard/alerts).
   */
  async getActiveCountByPatient(patientId: string) {
    return this.prisma.patientAllergyRecord.count({
      where: { patientId, status: 'ACTIVE' },
    });
  }

  /**
   * Get severe/life-threatening allergies for a patient (critical alerts).
   */
  async getSevereAllergies(patientId: string) {
    return this.prisma.patientAllergyRecord.findMany({
      where: {
        patientId,
        status: 'ACTIVE',
        severity: { in: ['SEVERE', 'LIFE_THREATENING'] },
      },
      orderBy: { severity: 'asc' },
    });
  }
}
