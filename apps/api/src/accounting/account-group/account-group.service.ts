import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchQueryBuilder } from '../../common/services/search-query-builder';
import { paginate } from '../../common/utils/paginate';
import type { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import type { AccountGroup } from '@prisma/client';
import { CreateAccountGroupDto } from './dto/create-account-group.dto';
import { UpdateAccountGroupDto } from './dto/update-account-group.dto';
import { FindAccountGroupsQueryDto } from './dto/find-account-groups-query.dto';

@Injectable()
export class AccountGroupService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAccountGroupDto, userId?: string) {
    // Validate nature exists
    const nature = await this.prisma.accountNature.findUnique({ where: { id: dto.natureId } });
    if (!nature) throw new NotFoundException(`AccountNature ${dto.natureId} not found`);

    // Validate parent exists if provided
    if (dto.parentGroupId) {
      const parent = await this.prisma.accountGroup.findUnique({ where: { id: dto.parentGroupId } });
      if (!parent) throw new NotFoundException(`AccountGroup ${dto.parentGroupId} not found`);
    }

    // Check unique name within nature
    const existing = await this.prisma.accountGroup.findFirst({
      where: { name: dto.name, natureId: dto.natureId },
    });
    if (existing) throw new ConflictException(`AccountGroup "${dto.name}" already exists in this nature`);

    return this.prisma.accountGroup.create({
      data: {
        ...dto,
        createdById: userId ?? null,
      },
    });
  }

  async findAll(query: FindAccountGroupsQueryDto): Promise<PaginatedResult<AccountGroup>> {
    const searchWhere = SearchQueryBuilder.search(query.search, ['name']);
    const where: Record<string, unknown> = {
      ...(searchWhere ?? {}),
    };
    if (query.natureId) where.natureId = query.natureId;

    return paginate(
      () => this.prisma.accountGroup.count({ where }),
      ({ skip, take }) =>
        this.prisma.accountGroup.findMany({
          where,
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
          skip,
          take,
          include: { nature: true, parentGroup: true, childGroups: true, ledgers: true },
        }),
      query,
    );
  }

  async findOne(id: string) {
    const group = await this.prisma.accountGroup.findUnique({
      where: { id },
      include: { nature: true, parentGroup: true, childGroups: true, ledgers: true },
    });
    if (!group) throw new NotFoundException(`AccountGroup ${id} not found`);
    return group;
  }

  /** Returns the full tree of groups grouped by nature. */
  async findTree() {
    const natures = await this.prisma.accountNature.findMany({
      orderBy: { code: 'asc' },
      include: {
        accountGroups: {
          orderBy: { name: 'asc' },
          include: { childGroups: { orderBy: { name: 'asc' } } },
        },
      },
    });
    return natures;
  }

  async update(id: string, dto: UpdateAccountGroupDto, userId?: string) {
    await this.findOne(id);
    if (dto.name && dto.natureId) {
      const existing = await this.prisma.accountGroup.findFirst({
        where: { name: dto.name, natureId: dto.natureId, NOT: { id } },
      });
      if (existing) throw new ConflictException(`AccountGroup "${dto.name}" already exists in this nature`);
    }
    return this.prisma.accountGroup.update({
      where: { id },
      data: { ...dto, updatedById: userId ?? null },
    });
  }

  async remove(id: string, deletedById?: string) {
    await this.findOne(id);
    const ledgerCount = await this.prisma.ledger.count({ where: { accountGroupId: id } });
    if (ledgerCount > 0) {
      throw new ConflictException(
        `Cannot delete account group: ${ledgerCount} ledger(s) reference it.`,
      );
    }
    const childCount = await this.prisma.accountGroup.count({ where: { parentGroupId: id } });
    if (childCount > 0) {
      throw new ConflictException(
        `Cannot delete account group: ${childCount} child group(s) reference it.`,
      );
    }
    return this.prisma.accountGroup.update({
      where: { id },
      data: {},
    });
  }
}
