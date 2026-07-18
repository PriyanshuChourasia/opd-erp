import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { AuthResponseDto, UserableType } from './dto/auth-response.dto';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type { ChangePasswordDto } from './dto/change-password.dto';

function asUserableType(val: string | null): UserableType | null {
  const allowed: UserableType[] = ['Doctor', 'Patient', 'Nurse', 'Receptionist', 'Pharmacist', 'LabStaff'];
  return allowed.includes(val as UserableType) ? (val as UserableType) : null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Check if email already exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('A user with this email already exists');
    }

    // Check if username already exists
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException('A user with this username already exists');
    }

    // Find or create the default ADMIN role for newly registered users
    let role = await this.prisma.role.findFirst({
      where: { name: 'ADMIN' },
    });
    if (!role) {
      role = await this.prisma.role.create({
        data: { name: 'ADMIN', description: 'Administrator with full access', isSystem: true },
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
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
        roleId: role.id,
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    // Generate tokens
    const accessToken = this.generateAccessToken(user);

    return {
      accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roleName: user.role.name,
        permissions: user.role.rolePermissions.map(
          (rp) => `${rp.permission.action}:${rp.permission.resource}`,
        ),
        username: user.username,
        userableType: asUserableType(user.userableType),
        userableId: user.userableId,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    // Find user by email or username
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          dto.email ? { email: dto.email } : {},
          dto.username ? { username: dto.username } : {},
        ].filter((cond) => Object.keys(cond).length > 0),
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);

    return {
      accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roleName: user.role.name,
        permissions: user.role.rolePermissions.map(
          (rp) => `${rp.permission.action}:${rp.permission.resource}`,
        ),
        username: user.username,
        userableType: asUserableType(user.userableType),
        userableId: user.userableId,
      },
    };
  }

  private generateAccessToken(user: {
    id: string;
    email: string;
    role: { name: string };
  }): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
    };
    return this.jwtService.sign(payload);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      email: user.email,
      mobileNumber: user.mobileNumber,
      countryCode: user.countryCode,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth?.toISOString() ?? null,
      profilePhotoUrl: user.profilePhotoUrl,
      qualification: user.qualification,
      username: user.username,
      roleName: user.role.name,
      createdAt: user.createdAt.toISOString(),
      permissions: user.role.rolePermissions.map(
        (rp) => `${rp.permission.action}:${rp.permission.resource}`,
      ),
      userableType: asUserableType(user.userableType),
      userableId: user.userableId,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // If email is being changed, check it's not taken
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    // Build update data, converting dateOfBirth string to Date if present
    const data: Prisma.UserUpdateInput = { ...dto };
    if (dto.dateOfBirth) {
      (data as any).dateOfBirth = new Date(dto.dateOfBirth);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    return {
      id: updated.id,
      firstName: updated.firstName,
      middleName: updated.middleName,
      lastName: updated.lastName,
      email: updated.email,
      mobileNumber: updated.mobileNumber,
      countryCode: updated.countryCode,
      gender: updated.gender,
      dateOfBirth: updated.dateOfBirth?.toISOString() ?? null,
      profilePhotoUrl: updated.profilePhotoUrl,
      qualification: updated.qualification,
      username: updated.username,
      roleName: updated.role.name,
      createdAt: updated.createdAt.toISOString(),
      permissions: updated.role.rolePermissions.map(
        (rp) => `${rp.permission.action}:${rp.permission.resource}`,
      ),
      userableType: asUserableType(updated.userableType),
      userableId: updated.userableId,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password updated successfully' };
  }
}
