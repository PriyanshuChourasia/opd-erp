import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryBuilder } from '../common/services/search-query-builder';
import type { IBaseService, ISearchable } from '../common/interfaces/base-service.interface';
import type { Patient } from '@prisma/client';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

/**
 * Manages patient registration, search, and profile lifecycle.
 *
 * # SOLID
 * - **Single Responsibility** — only patient CRUD.
 * - **Dependency Inversion** — implements `IBaseService` & `ISearchable` contracts.
 */
@Injectable()
export class PatientsService implements IBaseService<Patient, CreatePatientDto, UpdatePatientDto>, ISearchable<Patient> {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePatientDto) {
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
      },
    });
  }

  async findAll(search?: string) {
    const where = SearchQueryBuilder.search(search, ['name', 'phone', 'email']);
    return this.prisma.patient.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) throw new NotFoundException(`Patient ${id} not found`);
    return patient;
  }

  async update(id: string, dto: UpdatePatientDto) {
    await this.findOne(id);
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
    return this.prisma.patient.delete({ where: { id } });
  }
}
