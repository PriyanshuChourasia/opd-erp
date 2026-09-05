import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchQueryBuilder } from '../../common/services/search-query-builder';
import { paginate } from '../../common/utils/paginate';
import type { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import type { Ledger } from '@prisma/client';
import { FindLedgersQueryDto } from './dto/find-ledgers-query.dto';

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FindLedgersQueryDto): Promise<PaginatedResult<Ledger>> {
    const searchWhere = SearchQueryBuilder.search(query.search, ['name', 'code']);
    const where: Record<string, unknown> = {
      ...(searchWhere ?? {}),
    };
    if (query.accountGroupId) where.accountGroupId = query.accountGroupId;
    if (query.patientId) where.patientId = query.patientId;
    if (query.doctorId) where.doctorId = query.doctorId;
    if (query.userId) where.userId = query.userId;
    if (query.companyId) where.companyId = query.companyId;

    return paginate(
      () => this.prisma.ledger.count({ where }),
      ({ skip, take }) =>
        this.prisma.ledger.findMany({
          where,
          include: {
            accountGroup: { include: { nature: true } },
            patient: { select: { id: true, firstName: true, lastName: true, patientCode: true } },
          },
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );
  }

  async findOne(id: string) {
    const ledger = await this.prisma.ledger.findUnique({
      where: { id },
      include: {
        accountGroup: { include: { nature: true } },
        patient: { select: { id: true, firstName: true, lastName: true, patientCode: true } },
        journalLines: {
          include: {
            journal: {
              include: {
                journalType: true,
                voucher: { include: { voucherType: true } },
              },
            },
          },
          orderBy: { journal: { createdAt: 'desc' } },
          take: 50,
        },
      },
    });
    if (!ledger) throw new NotFoundException(`Ledger ${id} not found`);
    return ledger;
  }
}
