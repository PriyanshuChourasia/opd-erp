import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchQueryBuilder } from '../../common/services/search-query-builder';
import { paginate } from '../../common/utils/paginate';
import type { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import type { Journal } from '@prisma/client';
import { FindJournalsQueryDto } from './dto/find-journals-query.dto';

@Injectable()
export class JournalService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FindJournalsQueryDto): Promise<PaginatedResult<Journal>> {
    const searchWhere = SearchQueryBuilder.search(query.search, ['notes']);
    const where: Record<string, unknown> = {
      ...(searchWhere ?? {}),
    };
    if (query.journalTypeId) where.journalTypeId = query.journalTypeId;
    if (query.voucherId) where.voucherId = query.voucherId;
    if (query.isPosted !== undefined) where.isPosted = query.isPosted === 'true';

    return paginate(
      () => this.prisma.journal.count({ where }),
      ({ skip, take }) =>
        this.prisma.journal.findMany({
          where,
          include: {
            journalType: true,
            voucher: { select: { id: true, voucherNumber: true, voucherType: { select: { name: true } } } },
            lines: {
              include: {
                ledger: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );
  }

  async findOne(id: string) {
    const journal = await this.prisma.journal.findUnique({
      where: { id },
      include: {
        journalType: true,
        voucher: {
          include: {
            voucherType: true,
            financialYear: { select: { id: true, name: true } },
          },
        },
        lines: {
          include: {
            ledger: {
              include: {
                accountGroup: { include: { nature: true } },
              },
            },
          },
        },
      },
    });
    if (!journal) throw new NotFoundException(`Journal ${id} not found`);
    return journal;
  }
}
