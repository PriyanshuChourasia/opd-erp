import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/paginate';
import type { IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { DoctorDepartment } from '@prisma/client';
import { CreateDoctorDepartmentDto } from './dto/create-doctor-department.dto';
import { FindDoctorDepartmentsQueryDto } from './dto/find-doctor-departments-query.dto';

const INCLUDE = { department: true, doctor: true } as const;

@Injectable()
export class DoctorDepartmentsService implements IPaginatable<DoctorDepartment, FindDoctorDepartmentsQueryDto> {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDoctorDepartmentDto, userId?: string) {
    // Validate doctor and department exist
    const doctor = await this.prisma.doctor.findUnique({ where: { id: dto.doctorId } });
    if (!doctor) throw new NotFoundException(`Doctor ${dto.doctorId} not found`);
    const dept = await this.prisma.department.findUnique({ where: { id: dto.departmentId } });
    if (!dept) throw new NotFoundException(`Department ${dto.departmentId} not found`);

    const existing = await this.prisma.doctorDepartment.findUnique({
      where: { doctorId_departmentId: { doctorId: dto.doctorId, departmentId: dto.departmentId } },
    });
    if (existing) throw new ConflictException(`Doctor is already linked to this department`);

    return this.prisma.doctorDepartment.create({
      data: { ...dto, createdById: userId ?? null },
      include: INCLUDE,
    });
  }

  async findAll(query: FindDoctorDepartmentsQueryDto): Promise<PaginatedResult<DoctorDepartment>> {
    const where: Record<string, unknown> = {};
    if (query.doctorId) where.doctorId = query.doctorId;
    if (query.departmentId) where.departmentId = query.departmentId;

    return paginate(
      () => this.prisma.doctorDepartment.count({ where }),
      ({ skip, take }) =>
        this.prisma.doctorDepartment.findMany({ where, include: INCLUDE, orderBy: { createdAt: 'desc' }, skip, take }),
      query,
    );
  }

  async remove(id: string) {
    const link = await this.prisma.doctorDepartment.findUnique({ where: { id } });
    if (!link) throw new NotFoundException(`DoctorDepartment link ${id} not found`);
    return this.prisma.doctorDepartment.delete({ where: { id } });
  }
}
