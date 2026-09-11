import {
  normalizePermissionToDot,
  permissionSlug,
} from './permission.util';

describe('permission.util', () => {
  describe('permissionSlug()', () => {
    it('maps read → view and kebab resources to snake module keys', () => {
      expect(permissionSlug('users', 'read')).toBe('users.view');
      expect(permissionSlug('financial-years', 'read')).toBe('financial_years.view');
      expect(permissionSlug('medicine-catalog', 'create')).toBe('medicine_catalog.create');
      expect(permissionSlug('roles', 'delete')).toBe('roles.delete');
    });
  });

  describe('normalizePermissionToDot()', () => {
    it('keeps already-canonical dotted permissions untouched', () => {
      expect(normalizePermissionToDot('users.view')).toBe('users.view');
      expect(normalizePermissionToDot('user_role.delete')).toBe('user_role.delete');
    });

    it('converts legacy "action:resource" to the canonical dotted form', () => {
      expect(normalizePermissionToDot('read:users')).toBe('users.view');
      expect(normalizePermissionToDot('create:roles')).toBe('roles.create');
      expect(normalizePermissionToDot('manage:patients')).toBe('patients.manage');
    });
  });
});