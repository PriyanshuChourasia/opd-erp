import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryBuilder } from '../common/services/search-query-builder';
import { paginate } from '../common/utils/paginate';
import type { IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { FindUsersQueryDto } from './dto/find-users-query.dto';

/** Selection shared by list queries — never selects `password` or `refreshTokens`. */
const userListSelect = {
  id: true,
  firstName: true,
  middleName: true,
  lastName: true,
  email: true,
  mobileNumber: true,
  countryCode: true,
  gender: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { name: true } },
} satisfies Prisma.UserSelect;

export type UserListItem = Prisma.UserGetPayload<{ select: typeof userListSelect }>;

/**
 * Read-only listing of application users (name/email/role/status).
 *
 * # SOLID
 * - **Single Responsibility** — only user listing; create/update/delete of
 *   accounts is a separate, larger user-management feature (out of scope).
 * - **Dependency Inversion** — implements the `IPaginatable` contract.
 */
@Injectable()
export class UsersService implements IPaginatable<UserListItem, FindUsersQueryDto> {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FindUsersQueryDto): Promise<PaginatedResult<UserListItem>> {
    const where = SearchQueryBuilder.search(query.search, ['firstName', 'lastName', 'email', 'mobileNumber']);
    return paginate(
      () => this.prisma.user.count({ where }),
      ({ skip, take }) =>
        this.prisma.user.findMany({
          where,
          select: userListSelect,
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );
  }
}
