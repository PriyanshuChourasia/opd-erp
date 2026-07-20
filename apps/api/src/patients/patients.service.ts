import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryBuilder } from '../common/services/search-query-builder';
import { paginate } from '../common/utils/paginate';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { Patient } from '@prisma/client';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { FindPatientsQueryDto } from './dto/find-patients-query.dto';

/**
 * Manages patient registration, search, and profile lifecycle.
 *
 * # SOLID
 * - **Single Responsibility** — only patient CRUD.
 * - **Dependency Inversion** — implements `IBaseService` & `IPaginatable` contracts.
 */
@Injectable()
export class PatientsService
  implements IBaseService<Patient, CreatePatientDto, UpdatePatientDto>, IPaginatable<Patient, FindPatientsQueryDto>
{
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePatientDto) {
    const existing = await this.prisma.patient.findUnique({ where: { phone: dto.phone } });
    if (existing) throw new ConflictException(`A patient with phone number "${dto.phone}" is already registered`);
    return this.prisma.patient.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender,
        bloodGroup: dto.bloodGroup,
        address: dto.address,
        emergencyContact: dto.emergencyContact,
        allergies: dto.allergies ?? [],
        isFollowUp: dto.isFollowUp ?? false,
      },
    });
  }

  async findAll(query: FindPatientsQueryDto): Promise<PaginatedResult<Patient>> {
    const where: Record<string, unknown> = { ...SearchQueryBuilder.search(query.search, ['name', 'phone', 'email']) };
    // Soft-delete: only show active patients by default
    where.isActive = true;
    return paginate(
      () => this.prisma.patient.count({ where }),
      ({ skip, take }) => this.prisma.patient.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip, take }),
      query,
    );
  }

  async findOne(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        patientAllergies: {
          include: { allergy: true },
        },
      },
    });
    if (!patient) throw new NotFoundException(`Patient ${id} not found`);
    return patient;
  }

  async update(id: string, dto: UpdatePatientDto) {
    await this.findOne(id);
    if (dto.phone) {
      const existing = await this.prisma.patient.findFirst({ where: { phone: dto.phone, NOT: { id } } });
      if (existing) throw new ConflictException(`A patient with phone number "${dto.phone}" is already registered`);
    }
    return this.prisma.patient.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.patient.update({ where: { id }, data: { isActive: false } });
  }

  async restore(id: string) {
    await this.findOne(id);
    return this.prisma.patient.update({ where: { id }, data: { isActive: true } });
  }
}
