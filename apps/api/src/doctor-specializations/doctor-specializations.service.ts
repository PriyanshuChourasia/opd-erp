import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/paginate';
import type { IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { DoctorSpecialization } from '@prisma/client';
import { CreateDoctorSpecializationDto } from './dto/create-doctor-specialization.dto';
import { FindDoctorSpecializationsQueryDto } from './dto/find-doctor-specializations-query.dto';

const INCLUDE = { specialization: true, doctor: true } as const;

@Injectable()
export class DoctorSpecializationsService implements IPaginatable<DoctorSpecialization, FindDoctorSpecializationsQueryDto> {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDoctorSpecializationDto, userId?: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { id: dto.doctorId } });
    if (!doctor) throw new NotFoundException(`Doctor ${dto.doctorId} not found`);
    const spec = await this.prisma.specialization.findUnique({ where: { id: dto.specializationId } });
    if (!spec) throw new NotFoundException(`Specialization ${dto.specializationId} not found`);

    const existing = await this.prisma.doctorSpecialization.findUnique({
      where: { doctorId_specializationId: { doctorId: dto.doctorId, specializationId: dto.specializationId } },
    });
    if (existing) throw new ConflictException(`Doctor is already linked to this specialization`);

    return this.prisma.doctorSpecialization.create({
      data: { ...dto, createdById: userId ?? null },
      include: INCLUDE,
    });
  }

  async findAll(query: FindDoctorSpecializationsQueryDto): Promise<PaginatedResult<DoctorSpecialization>> {
    const where: Record<string, unknown> = {};
    if (query.doctorId) where.doctorId = query.doctorId;
    if (query.specializationId) where.specializationId = query.specializationId;

    return paginate(
      () => this.prisma.doctorSpecialization.count({ where }),
      ({ skip, take }) =>
        this.prisma.doctorSpecialization.findMany({ where, include: INCLUDE, orderBy: { createdAt: 'desc' }, skip, take }),
      query,
    );
  }

  async remove(id: string) {
    const link = await this.prisma.doctorSpecialization.findUnique({ where: { id } });
    if (!link) throw new NotFoundException(`DoctorSpecialization link ${id} not found`);
    return this.prisma.doctorSpecialization.delete({ where: { id } });
  }
}
