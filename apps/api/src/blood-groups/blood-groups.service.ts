import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FindBloodGroupsQueryDto } from './dto/find-blood-groups-query.dto';
import { BloodGroup } from '@prisma/client';

@Injectable()
export class BloodGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FindBloodGroupsQueryDto): Promise<BloodGroup[]> {
    const where: any = { isActive: true };
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }
    return this.prisma.bloodGroup.findMany({ where, orderBy: { name: 'asc' } });
  }

  async findOne(id: string): Promise<BloodGroup> {
    const bg = await this.prisma.bloodGroup.findUnique({ where: { id } });
    if (!bg) throw new NotFoundException(`Blood group ${id} not found`);
    return bg;
  }
}
