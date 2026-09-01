<?php

namespace Tests\Feature;

use App\Enums\LicenseStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Modules\Customer\Models\Customer;
use Modules\License\Models\License;
use Modules\License\Models\LicenseFeature;
use Modules\License\Models\LicensePlan;
use Modules\Organization\Models\Organization;
use Modules\Organization\Services\TenantService;
use Modules\Permission\Models\Permission;
use Modules\Role\Models\Role;
use Tests\TestCase;

class LicensingArchitectureTest extends TestCase
{
    use RefreshDatabase;

    private function uuidLike(): string
    {
        return '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/';
    }

    /** @var array<string, string> */
    private const UUID_TABLES = [
        'users',
        'organizations',
        'customers',
        'licenses',
        'license_plans',
        'license_features',
        'license_feature_mapping',
        'license_renewals',
        'roles',
        'permissions',
        'user_role',
        'user_permission',
        'role_permissions',
        'employees',
        'documents',
        'countries',
        'states',
    ];

    public function test_all_primary_keys_are_uuids(): void
    {
        foreach (self::UUID_TABLES as $table) {
            $columns = DB::select("SHOW COLUMNS FROM `$table`");
            $idColumn = collect($columns)->firstWhere('Field', 'id');

            $this->assertNotNull($idColumn, "Table `$table` must have an `id` column.");
            $this->assertSame('char(36)', $idColumn->Type, "`$table`.id must be a 36-char UUID column.");
        }
    }

    public function test_licenses_reference_plan_via_normalized_fk(): void
    {
        $plan = LicensePlan::query()->create([
            'code' => 'PRO_TEST',
            'name' => 'Professional Test',
            'price' => 999.00,
            'currency' => 'USD',
            'is_active' => true,
        ]);

        $customer = Customer::query()->create([
            'first_name' => 'Acme',
            'last_name' => 'Corp',
            'email' => 'billing@acme.test',
            'status' => 'active',
        ]);

        $organization = Organization::query()->create([
            'organization_code' => 'ORG-TEST-001',
            'legal_name' => 'Acme Corp LLC',
            'display_name' => 'Acme Corp',
            'email' => 'org@acme.test',
            'status' => 'active',
        ]);

        $license = License::query()->create([
            'license_number' => 'LIC-2026-TEST-0001',
            'customer_id' => $customer->id,
            'organization_id' => $organization->id,
            'plan_id' => $plan->id,
            'status' => LicenseStatus::ACTIVE,
            'start_date' => now()->toDateString(),
            'expiry_date' => now()->addYear()->toDateString(),
        ]);

        $this->assertSame($plan->id, $license->plan_id);
        $this->assertSame('PRO_TEST', $license->plan, 'plan attribute resolves to plan code.');

        $columns = collect(DB::select('SHOW COLUMNS FROM `licenses`'));
        $this->assertNull($columns->firstWhere('Field', 'plan'), 'licenses must not carry a free-text plan column.');
        $this->assertNull($columns->firstWhere('Field', 'features'), 'licenses must not carry a JSON features column.');
    }

    public function test_activation_secret_hash_is_hashed_and_never_serialized(): void
    {
        $customer = Customer::query()->create([
            'first_name' => 'Acme',
            'last_name' => 'Corp',
            'email' => 'billing@acme.test',
            'status' => 'active',
        ]);

        $organization = Organization::query()->create([
            'organization_code' => 'ORG-TEST-002',
            'legal_name' => 'Acme Corp LLC',
            'display_name' => 'Acme Corp',
            'email' => 'org@acme.test',
            'status' => 'active',
        ]);

        $plan = LicensePlan::query()->create(['code' => 'BASIC_TEST', 'name' => 'Basic Test']);

        $license = License::query()->create([
            'license_number' => 'LIC-2026-TEST-0002',
            'customer_id' => $customer->id,
            'organization_id' => $organization->id,
            'plan_id' => $plan->id,
            'status' => LicenseStatus::CREATED,
        ]);

        $license->forceFill(['activation_secret_hash' => hash('sha256', 'raw-secret')])->save();

        $this->assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $license->activation_secret_hash);

        $serialized = $license->toArray();
        $this->assertArrayNotHasKey('activation_secret_hash', $serialized);
        $this->assertArrayNotHasKey('activated_at', $serialized);
    }

    public function test_license_feature_mapping_attaches_features(): void
    {
        $plan = LicensePlan::query()->create(['code' => 'ENTERPRISE_TEST', 'name' => 'Enterprise Test']);

        $customer = Customer::query()->create([
            'first_name' => 'Acme',
            'last_name' => 'Corp',
            'email' => 'billing@acme.test',
            'status' => 'active',
        ]);

        $organization = Organization::query()->create([
            'organization_code' => 'ORG-TEST-003',
            'legal_name' => 'Acme Corp LLC',
            'display_name' => 'Acme Corp',
            'email' => 'org@acme.test',
            'status' => 'active',
        ]);

        $accounting = LicenseFeature::query()->create(['code' => 'ACCOUNTING', 'name' => 'Accounting', 'is_active' => true]);
        $inventory = LicenseFeature::query()->create(['code' => 'INVENTORY', 'name' => 'Inventory', 'is_active' => true]);

        $license = License::query()->create([
            'license_number' => 'LIC-2026-TEST-0003',
            'customer_id' => $customer->id,
            'organization_id' => $organization->id,
            'plan_id' => $plan->id,
            'status' => LicenseStatus::ACTIVE,
        ]);

        $license->features()->sync([
            $accounting->id => ['value' => true, 'limit_value' => 5],
            $inventory->id => ['value' => false, 'limit_value' => null],
        ]);

        $this->assertSame(2, $license->features()->count());
        $pivot = DB::table('license_feature_mapping')->where('license_id', $license->id)->where('feature_id', $accounting->id)->first();
        $this->assertSame(1, (int) $pivot->value);
        $this->assertSame(5, (int) $pivot->limit_value);
        $this->assertSame($accounting->id, $license->features()->where('code', 'ACCOUNTING')->first()->id);
    }

    public function test_roles_are_organization_scoped_with_permissions(): void
    {
        $organization = Organization::query()->create([
            'organization_code' => 'ORG-TEST-004',
            'legal_name' => 'Acme Corp LLC',
            'display_name' => 'Acme Corp',
            'email' => 'org@acme.test',
            'status' => 'active',
        ]);

        $other = Organization::query()->create([
            'organization_code' => 'ORG-TEST-005',
            'legal_name' => 'Other Corp LLC',
            'display_name' => 'Other Corp',
            'email' => 'org2@acme.test',
            'status' => 'active',
        ]);

        $role = Role::query()->create([
            'name' => 'Billing Staff',
            'slug' => 'billing-staff',
            'description' => 'Billing only.',
            'organization_id' => $organization->id,
            'is_system' => false,
        ]);

        $readPermission = Permission::query()->firstOrCreate(
            ['slug' => 'license.read'],
            ['name' => 'Read License', 'module' => 'License']
        );
        $revokePermission = Permission::query()->firstOrCreate(
            ['slug' => 'license.revoke'],
            ['name' => 'Revoke License', 'module' => 'License']
        );

        $role->permissions()->sync([$readPermission->id, $revokePermission->id]);

        $this->assertSame($organization->id, $role->organization_id);
        $this->assertCount(2, $role->permissions);
        $this->assertNotSame($other->id, $role->organization_id);

        $pivot = DB::table('role_permissions')->where('role_id', $role->id)->where('permission_id', $readPermission->id)->exists();
        $this->assertTrue($pivot);
    }

    public function test_user_role_attachment_uses_uuids(): void
    {
        $organization = Organization::query()->create([
            'organization_code' => 'ORG-TEST-006',
            'legal_name' => 'Acme Corp LLC',
            'display_name' => 'Acme Corp',
            'email' => 'org@acme.test',
            'status' => 'active',
        ]);

        $role = Role::query()->create([
            'name' => 'Admin',
            'slug' => 'admin',
            'organization_id' => $organization->id,
            'is_system' => true,
        ]);

        $user = User::query()->create([
            'name' => 'Jane Manager',
            'email' => 'jane@acme.test',
            'password' => 'Password@123',
            'organization_id' => $organization->id,
            'status' => 'active',
        ]);

        $user->roles()->sync([$role->id]);

        $this->assertTrue($user->roles()->where('roles.id', $role->id)->exists());
        $pivot = DB::table('user_role')->where('user_id', $user->id)->where('role_id', $role->id)->first();
        $this->assertNotNull($pivot);

        $this->assertMatchesRegularExpression($this->uuidLike(), $user->id);
        $this->assertMatchesRegularExpression($this->uuidLike(), $role->id);
    }

    public function test_tenant_service_validation_rules(): void
    {
        $plan = LicensePlan::query()->create(['code' => 'BASIC_VALID', 'name' => 'Basic Valid']);

        $customer = Customer::query()->create([
            'first_name' => 'Acme',
            'last_name' => 'Corp',
            'email' => 'billing@acme.test',
            'status' => 'active',
        ]);

        $organization = Organization::query()->create([
            'organization_code' => 'ORG-TEST-007',
            'legal_name' => 'Acme Corp LLC',
            'display_name' => 'Acme Corp',
            'email' => 'org@acme.test',
            'status' => 'active',
        ]);

        $license = License::query()->create([
            'license_number' => 'LIC-2026-TEST-0004',
            'customer_id' => $customer->id,
            'organization_id' => $organization->id,
            'plan_id' => $plan->id,
            'status' => LicenseStatus::ACTIVE,
            'start_date' => now()->subMonth()->toDateString(),
            'expiry_date' => now()->addYear()->toDateString(),
        ]);

        $user = User::query()->create([
            'name' => 'Jane Owner',
            'email' => 'jane@acme.test',
            'password' => 'Password@123',
            'organization_id' => $organization->id,
            'status' => 'active',
        ]);

        $tenantService = app(TenantService::class);

        $this->assertSame($organization->id, $tenantService->organizationFor($user)->id);
        $this->assertSame($license->id, $tenantService->licenseFor($organization)->id);
        $this->assertSame($license->id, $tenantService->validLicense($organization)->id);

        $license->status = LicenseStatus::EXPIRED;
        $license->save();
        $this->assertNull($tenantService->validLicense($organization));

        $license->status = LicenseStatus::ACTIVE;
        $license->expiry_date = now()->subDay()->toDateString();
        $license->save();
        $this->assertNull($tenantService->validLicense($organization), 'Past expiry must invalidate an active license.');
    }
}