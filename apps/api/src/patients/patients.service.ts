import { Injectable, NotFoundException } from '@nestjs/common';
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

  async create(dto: CreatePatientDto, userId?: string) {
    // Generate patientCode: FIRSTNAMELASTNAME-YYMMDD
    const patientCode = await this.generatePatientCode(dto.firstName, dto.lastName, dto.dateOfBirth);

    return this.prisma.patient.create({
      data: {
        patientCode,
        firstName: dto.firstName,
        middleName: dto.middleName,
        lastName: dto.lastName,
        contactNo: dto.contactNo,
        altContactNo: dto.altContactNo,
        email: dto.email,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender,
        bloodGroup: dto.bloodGroup,
        address: dto.address,
        emergencyContact: dto.emergencyContact,
        allergies: dto.allergies ?? [],
        isFollowUp: dto.isFollowUp ?? false,
        createdById: userId ?? null,
      },
    });
  }

  async findAll(query: FindPatientsQueryDto): Promise<PaginatedResult<Patient>> {
    const where: Record<string, unknown> = { ...SearchQueryBuilder.search(query.search, ['firstName', 'lastName', 'contactNo', 'email', 'patientCode']) };
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

  async update(id: string, dto: UpdatePatientDto, userId?: string) {
    await this.findOne(id);
    return this.prisma.patient.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        updatedById: userId ?? null,
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

  /**
   * Generate patientCode in format: FIRSTNAMELASTNAME-YYMMDD
   * If a collision exists, append a suffix (e.g., -01, -02).
   */
  private async generatePatientCode(firstName: string, lastName: string, dateOfBirth?: string): Promise<string> {
    const cleanFirst = firstName.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const cleanLast = lastName.replace(/[^a-zA-Z]/g, '').toUpperCase();
    
    let dateStr = '000000';
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const yy = dob.getFullYear().toString().slice(-2);
      const mm = (dob.getMonth() + 1).toString().padStart(2, '0');
      const dd = dob.getDate().toString().padStart(2, '0');
      dateStr = `${yy}${mm}${dd}`;
    }
    
    const baseCode = `${cleanFirst}${cleanLast}-${dateStr}`;
    
    // Check for existing codes with this base
    const existingCount = await this.prisma.patient.count({
      where: { patientCode: { startsWith: baseCode } },
    });
    
    if (existingCount === 0) {
      return baseCode;
    }
    
    // Append suffix to make it unique
    return `${baseCode}-${existingCount.toString().padStart(2, '0')}`;
  }
}
