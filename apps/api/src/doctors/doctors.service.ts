import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryBuilder } from '../common/services/search-query-builder';
import type { IBaseService, ISearchable } from '../common/interfaces/base-service.interface';
import type { Doctor } from '@prisma/client';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

/**
 * Manages doctor profiles, specializations, and license tracking.
 *
 * # SOLID
 * - **Single Responsibility** — only doctor CRUD.
 * - **Dependency Inversion** — implements `IBaseService` & `ISearchable` contracts.
 */
@Injectable()
export class DoctorsService implements IBaseService<Doctor, CreateDoctorDto, UpdateDoctorDto>, ISearchable<Doctor> {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDoctorDto) {
    return this.prisma.doctor.create({ data: dto });
  }

  async findAll(search?: string) {
    const where = SearchQueryBuilder.search(search, ['name', 'email', 'specialization', { field: 'licenseNumber', mode: undefined }]);
    return this.prisma.doctor.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { id } });
    if (!doctor) throw new NotFoundException(`Doctor ${id} not found`);
    return doctor;
  }

  async update(id: string, dto: UpdateDoctorDto) {
    await this.findOne(id);
    return this.prisma.doctor.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.doctor.delete({ where: { id } });
  }
}
