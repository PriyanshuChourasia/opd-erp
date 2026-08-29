import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/paginate';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { PatientVitals } from '@prisma/client';
import { CreatePatientVitalsDto } from './dto/create-patient-vitals.dto';

/**
 * Patient vitals recording — immutable once created.
 *
 * # SOLID
 * - **Single Responsibility** — only vitals creation and retrieval.
 * - **Immutable** — no update or delete operations (vitals are historical records).
 *
 * BMI is auto-calculated from height and weight:
 *   BMI = weight(kg) / (height(m))²
 */
@Injectable()
export class PatientVitalsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record new vitals for a patient.
   * BMI is automatically calculated if height and weight are provided.
   */
  async create(dto: CreatePatientVitalsDto, userId?: string) {
    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({ where: { id: dto.patientId } });
    if (!patient) throw new NotFoundException(`Patient ${dto.patientId} not found`);

    if (dto.appointmentId) {
      const appointment = await this.prisma.appointment.findUnique({ where: { id: dto.appointmentId } });
      if (!appointment) throw new NotFoundException(`Appointment ${dto.appointmentId} not found`);
    }

    // Auto-calculate BMI if height and weight are provided
    let bmi: number | null = null;
    if (dto.heightCm && dto.weightKg && dto.heightCm > 0) {
      const heightM = dto.heightCm / 100;
      bmi = parseFloat((dto.weightKg / (heightM * heightM)).toFixed(1));
    }

    return this.prisma.patientVitals.create({
      data: {
        patientId: dto.patientId,
        appointmentId: dto.appointmentId ?? null,
        heightCm: dto.heightCm ?? null,
        weightKg: dto.weightKg ?? null,
        bmi,
        temperatureC: dto.temperatureC ?? null,
        pulseBpm: dto.pulseBpm ?? null,
        systolicBp: dto.systolicBp ?? null,
        diastolicBp: dto.diastolicBp ?? null,
        spo2Percent: dto.spo2Percent ?? null,
        respiratoryRate: dto.respiratoryRate ?? null,
        recordedAt: dto.recordedAt ?? new Date(),
        createdById: userId ?? null,
      },
      include: { patient: { select: { id: true, firstName: true, lastName: true, patientCode: true } } },
    });
  }

  /**
   * Get vitals for a specific patient, ordered by most recent first.
   */
  async findByPatient(patientId: string, page = 1, limit = 20): Promise<PaginatedResult<PatientVitals>> {
    const where = { patientId };
    return paginate(
      () => this.prisma.patientVitals.count({ where }),
      ({ skip, take }) =>
        this.prisma.patientVitals.findMany({
          where,
          orderBy: { recordedAt: 'desc' },
          skip,
          take,
          include: { patient: { select: { id: true, firstName: true, lastName: true, patientCode: true } } },
        }),
      { page, limit },
    );
  }

  /**
   * Get a single vitals record by ID.
   */
  async findOne(id: string) {
    const vitals = await this.prisma.patientVitals.findUnique({
      where: { id },
      include: { patient: { select: { id: true, firstName: true, lastName: true, patientCode: true } } },
    });
    if (!vitals) throw new NotFoundException(`Patient vitals ${id} not found`);
    return vitals;
  }

  /**
   * Get the latest vitals for a patient.
   */
  async findLatest(patientId: string) {
    const vitals = await this.prisma.patientVitals.findFirst({
      where: { patientId },
      orderBy: { recordedAt: 'desc' },
      include: { patient: { select: { id: true, firstName: true, lastName: true, patientCode: true } } },
    });
    return vitals ?? null;
  }

  /**
   * Get vitals within a date range for a patient.
   */
  async findByDateRange(patientId: string, from: Date, to: Date) {
    return this.prisma.patientVitals.findMany({
      where: {
        patientId,
        recordedAt: { gte: from, lt: to },
      },
      orderBy: { recordedAt: 'desc' },
      include: { patient: { select: { id: true, firstName: true, lastName: true, patientCode: true } } },
    });
  }

  // Intentionally no update() or remove() — vitals are immutable historical records.
}
