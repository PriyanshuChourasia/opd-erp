import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';
import { TenantScope } from './scope.enum';

describe('TenantContextService', () => {
  let service: TenantContextService;

  beforeEach(() => {
    service = new TenantContextService();
  });

  function makeRequest(user?: Record<string, unknown>) {
    const req: Record<string, unknown> = {};
    if (user) req.user = user;
    return req as Parameters<TenantContextService['resolveFromRequest']>[0];
  }

  describe('fromAuthUser()', () => {
    it('derives TENANT scope when the user carries an organizationId', () => {
      const ctx = service.fromAuthUser({
        id: 'u1',
        roleId: 'r1',
        roleName: 'Admin',
        organizationId: 'org-a',
        permissions: ['read:users', 'create:roles'],
      });
      expect(ctx.organizationId).toBe('org-a');
      expect(ctx.scope).toBe(TenantScope.TENANT);
      expect(ctx.permissionSlugs).toEqual(
        expect.arrayContaining(['users.view', 'roles.create']),
      );
    });

    it('derives PLATFORM scope when the user has no organizationId', () => {
      const ctx = service.fromAuthUser({ id: 'dev', roleId: 'r9', roleName: 'Developer' });
      expect(ctx.organizationId).toBeNull();
      expect(ctx.scope).toBe(TenantScope.PLATFORM);
    });
  });

  describe('requireOrganization()', () => {
    it('returns the organizationId of an org-bound caller', () => {
      const req = makeRequest({ id: 'u1', roleId: 'r1', roleName: 'Admin', organizationId: 'org-a' });
      expect(service.requireOrganization(req)).toBe('org-a');
    });

    it("throws 403 for a platform caller (no org)", () => {
      const req = makeRequest({ id: 'dev', roleId: 'r9', roleName: 'Developer' });
      expect(() => service.requireOrganization(req)).toThrow(ForbiddenException);
    });

    it('throws 401 when there is no authenticated user', () => {
      const req = makeRequest();
      expect(() => service.requireOrganization(req)).toThrow(UnauthorizedException);
    });
  });

  describe('requirePlatform()', () => {
    it("throws 403 for an org-bound caller", () => {
      const req = makeRequest({ id: 'u1', roleId: 'r1', roleName: 'Admin', organizationId: 'org-a' });
      expect(() => service.requirePlatform(req)).toThrow(ForbiddenException);
    });

    it('passes for a platform caller', () => {
      const req = makeRequest({ id: 'dev', roleId: 'r9', roleName: 'Developer' });
      expect(() => service.requirePlatform(req)).not.toThrow();
    });
  });
});