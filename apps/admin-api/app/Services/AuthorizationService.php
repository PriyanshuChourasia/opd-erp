<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Authorization foundation (Task 4, step 4.26).
 *
 * Resolves a user's effective permission set from:
 *   1. permissions granted through their organization roles
 *      (roles -> role_permissions -> permissions)
 *   2. direct permissions (user_permission -> permissions)
 *
 * Results are cached for the lifetime of the request so repeated can() checks
 * do not hit the database more than once per user.
 */
class AuthorizationService
{
    /** @var array<string, array<int, string>> */
    private array $permissionCache = [];

    /**
     * Effective permission slugs for a user.
     *
     * @return array<int, string>
     */
    public function permissionsFor(?User $user): array
    {
        if (! $user) {
            return [];
        }

        $key = (string) $user->getKey();

        if (array_key_exists($key, $this->permissionCache)) {
            return $this->permissionCache[$key];
        }

        $rolePermissions = DB::table('role_permissions')
            ->join('permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->join('user_role', 'user_role.role_id', '=', 'role_permissions.role_id')
            ->where('user_role.user_id', $user->getKey())
            ->pluck('permissions.slug')
            ->all();

        $directPermissions = DB::table('user_permission')
            ->join('permissions', 'permissions.id', '=', 'user_permission.permission_id')
            ->where('user_permission.user_id', $user->getKey())
            ->pluck('permissions.slug')
            ->all();

        return $this->permissionCache[$key] = array_values(array_unique(array_merge($rolePermissions, $directPermissions)));
    }

    /**
     * @return array<int, string>
     */
    public function roleSlugsFor(?User $user): array
    {
        if (! $user) {
            return [];
        }

        return $user->roles()->pluck('roles.slug')->all();
    }

    public function hasPermission(User $user, string $permission): bool
    {
        return in_array($permission, $this->permissionsFor($user), true);
    }

    public function can(User $user, string $permission): bool
    {
        return $this->hasPermission($user, $permission);
    }
}