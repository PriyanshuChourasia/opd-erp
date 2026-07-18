import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryBuilder } from '../common/services/search-query-builder';
import { paginate } from '../common/utils/paginate';
import type { IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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
 * Manages application user accounts with full CRUD and soft-delete.
 *
 * # SOLID
 * - **Single Responsibility** — only user account management (create, read,
 *   update, soft-delete, restore).
 * - **Dependency Inversion** — implements the `IPaginatable` contract.
 */
@Injectable()
export class UsersService implements IPaginatable<UserListItem, FindUsersQueryDto> {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FindUsersQueryDto): Promise<PaginatedResult<UserListItem>> {
    const searchFilter = SearchQueryBuilder.search(query.search, ['firstName', 'lastName', 'email', 'mobileNumber']);
    const where: Record<string, unknown> = { ...searchFilter };

    // Filter by isActive: default to only active users, unless explicitly requested
    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    } else {
      where.isActive = true;
    }

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

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...userListSelect,
        roleId: true,
        username: true,
      },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async create(dto: CreateUserDto) {
    // Check email uniqueness
    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) {
      throw new ConflictException('A user with this email already exists');
    }

    // Check username uniqueness
    const existingUsername = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (existingUsername) {
      throw new ConflictException('A user with this username already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        username: dto.username,
        firstName: dto.firstName,
        middleName: dto.middleName,
        lastName: dto.lastName,
        email: dto.email,
        mobileNumber: dto.mobileNumber,
        countryCode: dto.countryCode ?? '+91',
        gender: dto.gender,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        profilePhotoUrl: dto.profilePhotoUrl,
        qualification: dto.qualification,
        password: hashedPassword,
        roleId: dto.roleId,
      },
      select: userListSelect,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    // Check email uniqueness if changing
    if (dto.email) {
      const existingEmail = await this.prisma.user.findFirst({ where: { email: dto.email, id: { not: id } } });
      if (existingEmail) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    // Build update data, skipping undefined fields
    const data: Record<string, unknown> = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.middleName !== undefined) data.middleName = dto.middleName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.mobileNumber !== undefined) data.mobileNumber = dto.mobileNumber;
    if (dto.countryCode !== undefined) data.countryCode = dto.countryCode;
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.dateOfBirth !== undefined) data.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.profilePhotoUrl !== undefined) data.profilePhotoUrl = dto.profilePhotoUrl;
    if (dto.qualification !== undefined) data.qualification = dto.qualification;
    if (dto.roleId !== undefined) data.roleId = dto.roleId;
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.update({
      where: { id },
      data,
      select: userListSelect,
    });
  }

  /** Soft-delete: set isActive = false */
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: userListSelect,
    });
  }

  /** Restore a previously soft-deleted user */
  async restore(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: userListSelect,
    });
  }

  /** List all available roles for the user creation/edit form */
  async findAllRoles() {
    return this.prisma.role.findMany({
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
    });
  }
}
