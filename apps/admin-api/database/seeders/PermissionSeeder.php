<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    /**
     * System-level permission catalog (platform data, not tenant data).
     * DC/AC = domain/action codes; see Task 2 RBAC design.
     */
    public function run(): void
    {
        $permissions = [
            ['name' => 'Create Organization', 'slug' => 'organization.create', 'module' => 'Organization'],
            ['name' => 'Read Organization', 'slug' => 'organization.read', 'module' => 'Organization'],
            ['name' => 'Update Organization', 'slug' => 'organization.update', 'module' => 'Organization'],
            ['name' => 'Delete Organization', 'slug' => 'organization.delete', 'module' => 'Organization'],
            ['name' => 'Create License', 'slug' => 'license.create', 'module' => 'License'],
            ['name' => 'Read License', 'slug' => 'license.read', 'module' => 'License'],
            ['name' => 'Update License', 'slug' => 'license.update', 'module' => 'License'],
            ['name' => 'Revoke License', 'slug' => 'license.revoke', 'module' => 'License'],
            ['name' => 'Activate License', 'slug' => 'license.activate', 'module' => 'License'],
            ['name' => 'Create User', 'slug' => 'user.create', 'module' => 'User'],
            ['name' => 'Read User', 'slug' => 'user.read', 'module' => 'User'],
            ['name' => 'Update User', 'slug' => 'user.update', 'module' => 'User'],
            ['name' => 'Delete User', 'slug' => 'user.delete', 'module' => 'User'],
            ['name' => 'Create Role', 'slug' => 'role.create', 'module' => 'Role'],
            ['name' => 'Read Role', 'slug' => 'role.read', 'module' => 'Role'],
            ['name' => 'Update Role', 'slug' => 'role.update', 'module' => 'Role'],
            ['name' => 'Delete Role', 'slug' => 'role.delete', 'module' => 'Role'],
            ['name' => 'Create Financial Year', 'slug' => 'financial-year.create', 'module' => 'FinancialYear'],
            ['name' => 'Read Financial Year', 'slug' => 'financial-year.read', 'module' => 'FinancialYear'],
            ['name' => 'Update Financial Year', 'slug' => 'financial-year.update', 'module' => 'FinancialYear'],
            ['name' => 'Set Current Financial Year', 'slug' => 'financial-year.set-current', 'module' => 'FinancialYear'],
            ['name' => 'Close Financial Year', 'slug' => 'financial-year.close', 'module' => 'FinancialYear'],
            ['name' => 'Delete Financial Year', 'slug' => 'financial-year.delete', 'module' => 'FinancialYear'],
        ];

        foreach ($permissions as $permission) {
            Permission::query()->updateOrCreate(
                ['slug' => $permission['slug']],
                $permission
            );
        }
    }
}