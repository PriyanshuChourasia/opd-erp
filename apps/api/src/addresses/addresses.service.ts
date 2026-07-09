import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/paginate';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { Address } from '@prisma/client';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { FindAddressesQueryDto } from './dto/find-addresses-query.dto';

/**
 * Manages polymorphic addresses for any entity (Users, Doctors, Organisations, etc.).
 *
 * # SOLID
 * - **Single Responsibility** — only address CRUD with polymorphic scoping.
 * - **Dependency Inversion** — implements `IBaseService` & `IPaginatable` contracts.
 */
@Injectable()
export class AddressesService
  implements IBaseService<Address, CreateAddressDto, UpdateAddressDto>, IPaginatable<Address, FindAddressesQueryDto>
{
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAddressDto) {
    // If this is the first address for the entity, or isPrimary is explicitly true,
    // ensure it becomes the primary by unsetting any existing primary.
    if (dto.isPrimary) {
      await this.prisma.address.updateMany({
        where: {
          addressableType: dto.addressableType,
          addressableId: dto.addressableId,
          isPrimary: true,
        },
        data: { isPrimary: false },
      });
    }

    return this.prisma.address.create({ data: dto });
  }

  async findAll(query: FindAddressesQueryDto): Promise<PaginatedResult<Address>> {
    const where: Record<string, unknown> = {};
    if (query.addressableType) where.addressableType = query.addressableType;
    if (query.addressableId) where.addressableId = query.addressableId;
    if (query.addressType) where.addressType = query.addressType;
    if (query.isPrimary !== undefined) where.isPrimary = query.isPrimary === 'true';

    return paginate(
      () => this.prisma.address.count({ where }),
      ({ skip, take }) =>
        this.prisma.address.findMany({
          where,
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );
  }

  /** Find all addresses for a given polymorphic entity. */
  async findByEntity(addressableType: string, addressableId: string) {
    return this.prisma.address.findMany({
      where: { addressableType, addressableId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /** Set a specific address as the primary for its entity (unsets all others). */
  async setPrimary(id: string) {
    const address = await this.findOne(id);

    await this.prisma.address.updateMany({
      where: {
        addressableType: address.addressableType,
        addressableId: address.addressableId,
        isPrimary: true,
      },
      data: { isPrimary: false },
    });

    return this.prisma.address.update({
      where: { id },
      data: { isPrimary: true },
    });
  }

  async findOne(id: string) {
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address) throw new NotFoundException(`Address ${id} not found`);
    return address;
  }

  async update(id: string, dto: UpdateAddressDto) {
    await this.findOne(id);

    // If promoting to primary, unset existing primary for the entity
    if (dto.isPrimary) {
      const existing = await this.prisma.address.findUnique({ where: { id } });
      if (existing) {
        await this.prisma.address.updateMany({
          where: {
            addressableType: existing.addressableType,
            addressableId: existing.addressableId,
            isPrimary: true,
            id: { not: id },
          },
          data: { isPrimary: false },
        });
      }
    }

    return this.prisma.address.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.address.delete({ where: { id } });
  }
}
