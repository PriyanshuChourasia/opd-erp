import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantScope } from '../../tenant/scope.enum';
import { permissionSlug } from '../../tenant/permission.util';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
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

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    const permissions = user.role.rolePermissions.map(
      (rp) => `${rp.permission.action}:${rp.permission.resource}`,
    );

    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
      organizationId: user.organizationId ?? null,
      scope: user.organizationId ? TenantScope.TENANT : TenantScope.PLATFORM,
      userableId: user.userableId,
      userableType: user.userableType,
      createdAt: user.createdAt.toISOString(),
      permissions,
      permissionSlugs: user.role.rolePermissions.map((rp) =>
        permissionSlug(rp.permission.resource, rp.permission.action),
      ),
    };
  }
}
