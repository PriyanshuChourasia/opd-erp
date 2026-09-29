import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateCityDto, UpdateCityDto, UpsertCityByNameDto } from './dto/create-city.dto';
import { FindCitiesQueryDto } from './dto/find-cities-query.dto';
import type { City } from '@prisma/client';

@Injectable()
export class CitiesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The heart of the "type it once, it's in the catalog" rule: returns the
   * existing (name, state) row, or creates it on first use. Safe against
   * concurrent first-typing thanks to the @@unique(name, state) + upsert.
   */
  async findOrCreate(dto: UpsertCityByNameDto, userId?: string): Promise<City> {
    const name = dto.name.trim();
    const state = dto.state.trim();
    if (!name || !state) {
      throw new ConflictException('Both city name and state are required');
    }
    return this.prisma.city.upsert({
      where: { name_state: { name, state } },
      update: { isActive: true },
      create: { name, state, createdById: userId ?? null },
    });
  }

  async create(dto: CreateCityDto, userId?: string): Promise<City> {
    const name = dto.name.trim();
    const state = dto.state.trim();
    const existing = await this.prisma.city.findUnique({
      where: { name_state: { name, state } },
    });
    if (existing) {
      throw new ConflictException(`City "${name}" already exists for state "${state}"`);
    }
    return this.prisma.city.create({ data: { name, state, createdById: userId ?? null } });
  }

  async findAll(query: FindCitiesQueryDto): Promise<City[]> {
    const where: Prisma.CityWhereInput = { isActive: true };
    if (query.state) {
      where.state = { equals: query.state.trim(), };
    }
    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { state: { contains: term, mode: 'insensitive' } },
      ];
    }
    // Light reference data: return all matching rows ordered by name —
    // the selects are small and pagination would just complicate the UI.
    return this.prisma.city.findMany({ where, orderBy: { name: 'asc' } });
  }

  async findOne(id: string): Promise<City> {
    const city = await this.prisma.city.findUnique({ where: { id } });
    if (!city) throw new NotFoundException(`City ${id} not found`);
    return city;
  }

  async update(id: string, dto: UpdateCityDto, userId?: string): Promise<City> {
    await this.findOne(id);
    const { name, state, isActive, ...rest } = dto;
    const data: Prisma.CityUpdateInput = {
      ...rest,
      ...(name ? { name: name.trim() } : {}),
      ...(state ? { state: state.trim() } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      updatedBy: { connect: { id: userId } },
    };
    if (dto.name) data.name = dto.name.trim();
    if (dto.state) data.state = dto.state.trim();
    try {
      return await this.prisma.city.update({ where: { id }, data });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(`City "${name}" already exists for state "${state}"`);
      }
      throw e;
    }
  }

  async remove(id: string, deletedById?: string): Promise<City> {
    await this.findOne(id);
    // Soft delete: keep the catalog row for history; the UI filters on isActive.
    return this.prisma.city.update({
      where: { id },
      data: { isActive: false, updatedById: deletedById ?? null },
    });
  }
}
