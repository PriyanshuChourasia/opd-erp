<?php

namespace Database\Seeders;

use App\Enums\LicenseStatus;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Modules\Customer\Models\Customer;
use Modules\License\Models\License;
use Modules\License\Models\LicenseFeature;
use Modules\License\Models\LicensePlan;
use Modules\Organization\Models\Organization;
use Modules\Permission\Models\Permission;
use Modules\Role\Models\Role;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the licensing architecture, system catalogs and demo users.
     */
    public function run(): void
    {
        $this->call([
            LicensePlanSeeder::class,
            LicenseFeatureSeeder::class,
            PermissionSeeder::class,
        ]);

        $this->seedDemoOrg();
        $this->seedAdminUsers();
    }

    private function seedDemoOrg(): void
    {
        $customer = Customer::query()->firstOrCreate(
            ['email' => 'billing@democlinic.com'],
            [
                'first_name' => 'OPD',
                'last_name' => 'ERP',
                'company_name' => 'Demo Clinic Group',
                'phone' => '+1-555-0100',
                'status' => 'active',
            ]
        );

        $organization = Organization::query()->firstOrCreate(
            ['organization_code' => 'ORG-DEMO-001'],
            [
                'legal_name' => 'Demo Clinic Group LLC',
                'display_name' => 'Demo Clinic Group',
                'registration_number' => 'REG-0001',
                'email' => 'org@democlinic.com',
                'phone' => '+1-555-0101',
                'country' => 'US',
                'status' => 'active',
                'timezone' => 'UTC',
                'locale' => 'en',
                'currency' => 'USD',
                'settings' => [],
            ]
        );

        /** @var LicensePlan $plan */
        $plan = LicensePlan::query()->where('code', 'ENTERPRISE')->firstOrFail();

        $license = License::query()->updateOrCreate(
            ['organization_id' => $organization->id],
            [
                'license_number' => 'LIC-2026-AB82K91X',
                'customer_id' => $customer->id,
                'plan_id' => $plan->id,
                'status' => LicenseStatus::ACTIVE,
                'issue_date' => now()->toDateString(),
                'start_date' => now()->toDateString(),
                'expiry_date' => now()->addYear()->toDateString(),
                'max_users' => 100,
                'max_devices' => 200,
            ]
        );

        // Activation secret is written directly (not mass-assigned) and only
        // its SHA-256 hash is stored — the raw value is never persisted.
        $rawSecret = 'SEC-'.$organization->organization_code.'-'.date('Y').'ZQ7K2';
        $license->forceFill(['activation_secret_hash' => hash('sha256', $rawSecret)])->save();

        // Tie the ENTERPRISE plan's feature set to this demo license.
        $featureIds = LicenseFeature::query()->pluck('id')->all();
        $license->features()->sync($featureIds);
    }

    private function seedAdminUsers(): void
    {
        $organization = Organization::query()->where('organization_code', 'ORG-DEMO-001')->firstOrFail();

        $adminRole = Role::query()->updateOrCreate(
            ['slug' => 'admin', 'organization_id' => $organization->id],
            [
                'name' => 'Admin',
                'description' => 'Organization administrator with full access.',
                'is_system' => true,
            ]
        );

        $adminRole->permissions()->sync(Permission::query()->pluck('id')->all());

        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@opderp.com'],
            [
                'name' => 'Head Admin',
                'password' => Hash::make('Password@123'),
                'organization_id' => $organization->id,
                'status' => 'active',
            ]
        );

        $admin->roles()->sync([$adminRole->id]);

        User::query()->updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
                'organization_id' => $organization->id,
                'status' => 'active',
            ]
        );
    }
}