import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/paginate';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { Appointment } from '@prisma/client';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { FindAppointmentsQueryDto } from './dto/find-appointments-query.dto';

/**
 * Appointment booking, scheduling, status tracking, and calendar management.
 *
 * # SOLID
 * - **Single Responsibility** — only appointment lifecycle.
 * - **Dependency Inversion** — implements `IBaseService` & `IPaginatable` contracts.
 */
@Injectable()
export class AppointmentsService
  implements
    IBaseService<Appointment, CreateAppointmentDto, UpdateAppointmentStatusDto>,
    IPaginatable<Appointment, FindAppointmentsQueryDto>
{
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAppointmentDto) {
    const date = new Date(dto.date);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const lastEntry = await this.prisma.appointment.findFirst({
      where: { doctorId: dto.doctorId, date: { gte: dayStart, lt: dayEnd } },
      orderBy: { tokenNumber: 'desc' },
    });
    const tokenNumber = (lastEntry?.tokenNumber ?? 0) + 1;

    return this.prisma.appointment.create({
      data: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        date,
        type: dto.type ?? 'CONSULTATION',
        fee: dto.fee ?? 0,
        notes: dto.notes,
        tokenNumber,
      },
      include: { patient: true, doctor: true },
    });
  }

  async findAll(query: FindAppointmentsQueryDto): Promise<PaginatedResult<Appointment>> {
    const where: Record<string, unknown> = {};
    if (query.doctorId) where.doctorId = query.doctorId;
    if (query.status) where.status = query.status;
    if (query.patientId) where.patientId = query.patientId;
    if (query.date) {
      const dayStart = new Date(query.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      where.date = { gte: dayStart, lt: dayEnd };
    }

    return paginate(
      () => this.prisma.appointment.count({ where }),
      ({ skip, take }) =>
        this.prisma.appointment.findMany({
          where,
          include: { patient: true, doctor: true },
          orderBy: [{ date: 'asc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { patient: true, doctor: true },
    });
    if (!appointment) throw new NotFoundException(`Appointment ${id} not found`);
    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentStatusDto) {
    await this.findOne(id);
    return this.prisma.appointment.update({
      where: { id },
      data: { status: dto.status },
      include: { patient: true, doctor: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.appointment.delete({ where: { id } });
  }
}
