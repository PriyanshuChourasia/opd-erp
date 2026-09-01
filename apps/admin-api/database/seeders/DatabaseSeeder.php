<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Modules\License\Models\License;
use Modules\Organization\Models\Organization;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the licensing architecture and demo users.
     */
    public function run(): void
    {
        $this->seedDemoOrg();
        $this->seedAdminUsers();
    }

    private function seedDemoOrg(): void
    {
        $customerId = DB::table('customers')->insertGetId([
            'first_name' => 'OPD',
            'last_name' => 'ERP',
            'company_name' => 'Demo Clinic Group',
            'email' => 'billing@democlinic.com',
            'phone' => '+1-555-0100',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $organization = Organization::query()->firstOrCreate(
            ['name' => 'Demo Clinic Group'],
            [
                'legal_name' => 'Demo Clinic Group LLC',
                'email' => 'org@democlinic.com',
                'phone' => '+1-555-0101',
                'country' => 'US',
                'status' => 'active',
                'timezone' => 'UTC',
                'locale' => 'en',
                'currency' => 'USD',
            ]
        );

        License::query()->updateOrCreate(
            ['organization_id' => $organization->id],
            [
                'customer_id' => $customerId,
                'license_number' => 'LIC-2026-DEMO-0001',
                'status' => License::STATUS_ACTIVE,
                'issue_date' => now()->toDateString(),
                'start_date' => now()->toDateString(),
                'expiry_date' => now()->addYear()->toDateString(),
                'plan' => 'enterprise',
                'max_users' => 100,
                'max_devices' => 200,
                'features' => ['accounting', 'inventory', 'reports'],
            ]
        );
    }

    private function seedAdminUsers(): void
    {
        $orgId = Organization::query()->where('name', 'Demo Clinic Group')->value('id');

        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@opderp.com'],
            [
                'name' => 'Head Admin',
                'password' => 'Password@123',
                'organization_id' => $orgId,
                'status' => 'active',
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => 'password',
                'organization_id' => $orgId,
                'status' => 'active',
            ]
        );

        $adminRoleId = DB::table('roles')->insertGetId([
            'name' => 'Admin',
            'slug' => 'admin',
            'description' => 'Full access within the organization.',
            'organization_id' => $orgId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('user_role')->updateOrInsert(
            ['user_id' => $admin->id, 'role_id' => $adminRoleId],
            ['created_at' => now(), 'updated_at' => now()]
        );
    }
}
