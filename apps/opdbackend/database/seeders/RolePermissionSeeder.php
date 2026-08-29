<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Modules\Permission\Models\Permission;
use Modules\Role\Models\Role;
use Modules\User\Models\User;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $resources = [
            'patients', 'appointments', 'doctors', 'prescriptions',
            'medicine-catalog', 'queue', 'billing', 'dispensing',
            'users', 'roles', 'settings', 'developer',
        ];
        $actions = ['read', 'create', 'update', 'delete', 'manage'];

        // Seed permissions
        $permissions = [];
        foreach ($resources as $resource) {
            foreach ($actions as $action) {
                $label = str_replace('-', ' ', $resource);
                $label = ucwords($label);
                $permissions[] = Permission::updateOrCreate(
                    ['resource' => $resource, 'action' => $action],
                    ['name' => ucfirst($action) . ' ' . $label]
                );
            }
        }

        // Super Admin — all permissions except developer
        $superAdminPerms = collect($permissions)->filter(fn ($p) => $p->resource !== 'developer')->pluck('id')->toArray();

        // Receptionist — patients, appointments, queue, billing + read doctors/medicine
        $receptionistResources = ['patients', 'appointments', 'queue', 'billing'];
        $receptionistPerms = collect($permissions)
            ->filter(fn ($p) => in_array($p->resource, $receptionistResources) || ($p->resource === 'doctors' && $p->action === 'read') || ($p->resource === 'medicine-catalog' && $p->action === 'read'))
            ->pluck('id')->toArray();

        // Doctor — read patients/appointments/queue/medicine, create/update prescriptions/lab/radiology/procedure
        $doctorPerms = collect($permissions)
            ->filter(fn ($p) =>
                in_array($p->resource, ['patients', 'appointments', 'queue', 'medicine-catalog']) && $p->action === 'read'
                || in_array($p->resource, ['prescriptions', 'lab-orders', 'radiology-orders', 'procedure-orders']) && in_array($p->action, ['read', 'create', 'update'])
            )->pluck('id')->toArray();

        // Assistant — read patients/appointments/medicine, read/update queue
        $assistantPerms = collect($permissions)
            ->filter(fn ($p) =>
                in_array($p->resource, ['patients', 'appointments', 'medicine-catalog']) && $p->action === 'read'
                || $p->resource === 'queue' && in_array($p->action, ['read', 'update'])
            )->pluck('id')->toArray();

        // Create roles
        $roles = [
            ['name' => 'Super Admin', 'description' => 'Full access to every module except Developer tools', 'is_system' => true, 'perms' => $superAdminPerms],
            ['name' => 'Receptionist', 'description' => 'Front-desk access to patients, appointments, queue, and billing', 'is_system' => true, 'perms' => $receptionistPerms],
            ['name' => 'Doctor', 'description' => 'Clinical staff: manage prescriptions, lab orders, and radiology orders', 'is_system' => true, 'perms' => $doctorPerms],
            ['name' => 'Assistant', 'description' => 'Support staff: manage queue and view basic patient info', 'is_system' => true, 'perms' => $assistantPerms],
        ];

        foreach ($roles as $roleData) {
            $perms = $roleData['perms'];
            unset($roleData['perms']);
            $role = Role::updateOrCreate(['name' => $roleData['name']], $roleData);
            $role->permissions()->sync($perms);
        }

        // Seed default users
        $superAdminRole = Role::where('name', 'Super Admin')->first();
        $receptionistRole = Role::where('name', 'Receptionist')->first();
        $doctorRole = Role::where('name', 'Doctor')->first();
        $assistantRole = Role::where('name', 'Assistant')->first();

        $users = [
            ['first_name' => 'Super', 'last_name' => 'Admin', 'email' => 'superadmin@clinic.com', 'username' => 'superadmin', 'role_id' => $superAdminRole->id],
            ['first_name' => 'Admin', 'last_name' => 'User', 'email' => 'admin@clinic.com', 'username' => 'admin', 'role_id' => $superAdminRole->id],
            ['first_name' => 'Priya', 'last_name' => 'Shah', 'email' => 'receptionist@clinic.com', 'username' => 'receptionist', 'role_id' => $receptionistRole->id],
            ['first_name' => 'Rajesh', 'last_name' => 'Sharma', 'email' => 'rajesh.sharma@clinic.com', 'username' => 'rajesh.sharma', 'role_id' => $doctorRole->id, 'userable_type' => 'Doctor', 'qualification' => 'MBBS, MD'],
            ['first_name' => 'Amit', 'last_name' => 'Kumar', 'email' => 'assistant@clinic.com', 'username' => 'assistant', 'role_id' => $assistantRole->id],
        ];

        foreach ($users as $userData) {
            $userData['password'] = bcrypt('Password@123');
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }

        $this->command->info('Seeded: ' . count($permissions) . ' permissions, ' . count($roles) . ' roles, ' . count($users) . ' users.');
    }
}
