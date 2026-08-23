import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { PrescriptionTemplate } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionTemplateDto, UpdatePrescriptionTemplateDto } from './dto/prescription-template.dto';

@Injectable()
export class PrescriptionTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<PrescriptionTemplate[]> {
    return this.prisma.prescriptionTemplate.findMany({
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string): Promise<PrescriptionTemplate> {
    const tpl = await this.prisma.prescriptionTemplate.findUnique({ where: { id } });
    if (!tpl) throw new NotFoundException('Prescription template not found');
    return tpl;
  }

  async findDefault(): Promise<PrescriptionTemplate | null> {
    return this.prisma.prescriptionTemplate.findFirst({ where: { isDefault: true } });
  }

  async create(dto: CreatePrescriptionTemplateDto, userId?: string): Promise<PrescriptionTemplate> {
    // If marking as default, unset others
    if (dto.isDefault) {
      await this.prisma.prescriptionTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false, updatedById: userId ?? null },
      });
    }

    return this.prisma.prescriptionTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        isDefault: dto.isDefault ?? false,
        logoUrl: dto.logoUrl,
        clinicName: dto.clinicName,
        doctorName: dto.doctorName,
        doctorSpecialization: dto.doctorSpecialization,
        doctorQualification: dto.doctorQualification,
        doctorRegNo: dto.doctorRegNo,
        clinicAddress: dto.clinicAddress,
        clinicPhone: dto.clinicPhone,
        clinicEmail: dto.clinicEmail,
        clinicWebsite: dto.clinicWebsite,
        layout: dto.layout ?? {},
        createdById: userId ?? null,
      },
    });
  }

  async update(id: string, dto: UpdatePrescriptionTemplateDto, userId?: string): Promise<PrescriptionTemplate> {
    await this.findOne(id);

    // If marking as default, unset others
    if (dto.isDefault === true) {
      await this.prisma.prescriptionTemplate.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false, updatedById: userId ?? null },
      });
    }

    return this.prisma.prescriptionTemplate.update({
      where: { id },
      data: {
        ...dto,
        layout: dto.layout !== undefined ? dto.layout : undefined,
        updatedById: userId ?? null,
      },
    });
  }

  async remove(id: string): Promise<void> {
    const tpl = await this.findOne(id);
    if (tpl.isDefault) {
      throw new BadRequestException('Cannot delete the default template. Set another as default first.');
    }
    await this.prisma.prescriptionTemplate.delete({ where: { id } });
  }

  async setDefault(id: string, userId?: string): Promise<PrescriptionTemplate> {
    await this.findOne(id);

    await this.prisma.prescriptionTemplate.updateMany({
      where: { isDefault: true },
      data: { isDefault: false, updatedById: userId ?? null },
    });

    return this.prisma.prescriptionTemplate.update({
      where: { id },
      data: { isDefault: true, updatedById: userId ?? null },
    });
  }
}
