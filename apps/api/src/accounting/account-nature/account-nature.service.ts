import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchQueryBuilder } from '../../common/services/search-query-builder';
import { paginate } from '../../common/utils/paginate';
import type { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import type { AccountNature } from '@prisma/client';
import { CreateAccountNatureDto } from './dto/create-account-nature.dto';
import { UpdateAccountNatureDto } from './dto/update-account-nature.dto';
import { FindAccountNaturesQueryDto } from './dto/find-account-natures-query.dto';

@Injectable()
export class AccountNatureService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAccountNatureDto) {
    const existing = await this.prisma.accountNature.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException(`AccountNature "${dto.code}" already exists`);
    return this.prisma.accountNature.create({ data: dto });
  }

  async findAll(query: FindAccountNaturesQueryDto): Promise<PaginatedResult<AccountNature>> {
    const searchWhere = SearchQueryBuilder.search(query.search, ['code', 'name']);
    const where = { ...(searchWhere ?? {}) };
    return paginate(
      () => this.prisma.accountNature.count({ where }),
      ({ skip, take }) =>
        this.prisma.accountNature.findMany({
          where,
          orderBy: [{ code: 'asc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );
  }

  async findOne(id: string) {
    const nature = await this.prisma.accountNature.findUnique({ where: { id } });
    if (!nature) throw new NotFoundException(`AccountNature ${id} not found`);
    return nature;
  }

  async update(id: string, dto: UpdateAccountNatureDto) {
    await this.findOne(id);
    if (dto.code) {
      const existing = await this.prisma.accountNature.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (existing) throw new ConflictException(`AccountNature "${dto.code}" already exists`);
    }
    return this.prisma.accountNature.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    const groupCount = await this.prisma.accountGroup.count({ where: { natureId: id } });
    if (groupCount > 0) {
      throw new ConflictException(
        `Cannot delete account nature: ${groupCount} group(s) reference it.`,
      );
    }
    return this.prisma.accountNature.delete({ where: { id } });
  }
}
