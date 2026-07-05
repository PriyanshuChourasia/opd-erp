import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Check if email already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    // Find the default role — use the first non-system role or create one
    let role = await this.prisma.role.findFirst({
      where: { name: 'RECEPTIONIST' },
    });
    if (!role) {
      role = await this.prisma.role.findFirst({
        orderBy: { createdAt: 'asc' },
      });
    }
    if (!role) {
      // Create a default role if none exist
      role = await this.prisma.role.create({
        data: { name: 'RECEPTIONIST', description: 'Default role' },
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
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
        name: user.name,
        email: user.email,
        roleName: user.role.name,
        permissions: user.role.rolePermissions.map(
          (rp) => `${rp.permission.action}:${rp.permission.resource}`,
        ),
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
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
      throw new UnauthorizedException('Invalid email or password');
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
        name: user.name,
        email: user.email,
        roleName: user.role.name,
        permissions: user.role.rolePermissions.map(
          (rp) => `${rp.permission.action}:${rp.permission.resource}`,
        ),
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
}
