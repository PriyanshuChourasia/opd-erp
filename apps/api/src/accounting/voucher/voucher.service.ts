import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchQueryBuilder } from '../../common/services/search-query-builder';
import { paginate } from '../../common/utils/paginate';
import type { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import type { Voucher } from '@prisma/client';
import { FindVouchersQueryDto } from './dto/find-vouchers-query.dto';

@Injectable()
export class VoucherService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FindVouchersQueryDto): Promise<PaginatedResult<Voucher>> {
    const searchWhere = SearchQueryBuilder.search(query.search, ['voucherNumber', 'notes']);
    const where: Record<string, unknown> = {
      ...(searchWhere ?? {}),
    };
    if (query.voucherTypeId) where.voucherTypeId = query.voucherTypeId;
    if (query.financialYearId) where.financialYearId = query.financialYearId;
    if (query.status) where.status = query.status;
    if (query.sourceModule) where.sourceModule = query.sourceModule;
    if (query.sourceId) where.sourceId = query.sourceId;

    return paginate(
      () => this.prisma.voucher.count({ where }),
      ({ skip, take }) =>
        this.prisma.voucher.findMany({
          where,
          include: {
            voucherType: true,
            financialYear: { select: { id: true, name: true } },
            partyLedger: { select: { id: true, name: true } },
            journals: { include: { journalType: true } },
          },
          orderBy: [{ voucherDate: 'desc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );
  }

  async findOne(id: string) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { id },
      include: {
        voucherType: true,
        financialYear: { select: { id: true, name: true } },
        partyLedger: { select: { id: true, name: true } },
        journals: {
          include: {
            journalType: true,
            lines: {
              include: {
                ledger: { select: { id: true, name: true } },
              },
            },
          },
        },
        voucherReferencesGiven: true,
        voucherReferencesReceived: true,
      },
    });
    if (!voucher) throw new NotFoundException(`Voucher ${id} not found`);
    return voucher;
  }
}
