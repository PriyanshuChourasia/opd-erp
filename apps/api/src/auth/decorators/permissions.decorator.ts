import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator that marks a handler or class as requiring specific permissions.
 * Used together with PermissionsGuard.
 *
 * @example
 * @Permissions('create:doctors', 'create:users')
 * @Post('with-user')
 * createWithUser() { ... }
 */
export function Permissions(...permissions: string[]) {
  return SetMetadata(PERMISSIONS_KEY, permissions);
}
