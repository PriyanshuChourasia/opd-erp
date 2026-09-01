<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Auth\Http\Requests\LoginRequest;
use Modules\Auth\Services\AuthService;
use Modules\License\Http\Requests\StoreLicenseRequest;
use Modules\License\Models\License;
use Modules\License\Services\LicenseService;
use Modules\Organization\Http\Requests\StoreOrganizationRequest;
use Modules\Organization\Http\Requests\UpdateOrganizationRequest;
use Modules\Organization\Models\Organization;
use Modules\Organization\Services\OrganizationService;
use Modules\Organization\Services\TenantService;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class LicensingArchitectureTest extends TestCase
{
    use RefreshDatabase;

    private Organization $organization;

    private int $customerId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customerId = DB::table('customers')->insertGetId([
            'first_name' => 'Acme',
            'last_name' => 'Corp',
            'email' => 'billing@acme.test',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->organization = Organization::query()->create([
            'name' => 'Acme Corp',
            'email' => 'org@acme.test',
            'status' => 'active',
        ]);

        License::query()->create([
            'customer_id' => $this->customerId,
            'organization_id' => $this->organization->id,
            'license_number' => 'LIC-2026-TEST-0001',
            'status' => License::STATUS_ACTIVE,
            'issue_date' => now()->toDateString(),
            'start_date' => now()->toDateString(),
            'expiry_date' => now()->addYear()->toDateString(),
            'plan' => 'professional',
        ]);

        User::query()->create([
            'name' => 'Org Admin',
            'email' => 'admin@acme.test',
            'password' => 'Password@123',
            'organization_id' => $this->organization->id,
            'status' => 'active',
        ]);
    }

    private function makeStoreOrganizationRequest(array $data): StoreOrganizationRequest
    {
        $request = StoreOrganizationRequest::create('/api/organizations', 'POST', $data);
        $request->setContainer(app());
        $request->validateResolved();

        return $request;
    }

    private function makeUpdateOrganizationRequest(array $data): UpdateOrganizationRequest
    {
        $request = UpdateOrganizationRequest::create('/api/organizations', 'PUT', $data);
        $request->setContainer(app());
        $request->validateResolved();

        return $request;
    }

    public function test_tenant_service_resolves_license_and_validates_it(): void
    {
        $tenantService = app(TenantService::class);

        $this->assertSame(
            $this->organization->id,
            $tenantService->organizationFor(User::first())->id
        );
        $this->assertNotNull($tenantService->licenseFor($this->organization));
        $this->assertInstanceOf(License::class, $tenantService->validLicense($this->organization));
    }

    public function test_login_succeeds_with_valid_license_and_exposes_org_context(): void
    {
        $request = LoginRequest::create('/api/auth/login', 'POST', [
            'email' => 'admin@acme.test',
            'password' => 'Password@123',
        ]);
        $request->setContainer(app());

        $result = app(AuthService::class)->login($request);

        $this->assertArrayHasKey('accessToken', $result);
        $this->assertSame((string) $this->organization->id, $result['user']['organizationId']);
        $this->assertSame('Acme Corp', $result['user']['organization']['name']);
        $this->assertSame('active', $result['user']['license']['status']);
    }

    public function test_login_is_blocked_without_active_license(): void
    {
        License::query()->where('organization_id', $this->organization->id)->update(['status' => 'suspended']);

        $request = LoginRequest::create('/api/auth/login', 'POST', [
            'email' => 'admin@acme.test',
            'password' => 'Password@123',
        ]);
        $request->setContainer(app());

        try {
            app(AuthService::class)->login($request);
            $this->fail('Login should have been blocked for a suspended license.');
        } catch (HttpException $e) {
            $this->assertSame(403, $e->getStatusCode());
            $this->assertStringContainsStringIgnoringCase('suspended', $e->getMessage());
        }
    }

    public function test_organization_service_crud(): void
    {
        $service = app(OrganizationService::class);

        $created = $service->store($this->makeStoreOrganizationRequest([
            'name' => 'Second Org',
            'legal_name' => 'Second Org LLC',
            'status' => 'active',
        ]));

        $this->assertSame('Second Org', $created['name']);
        $this->assertSame(2, $service->index(new Request)['meta']['total']);

        $updated = $service->update(Organization::find($created['id']), $this->makeUpdateOrganizationRequest([
            'name' => 'Second Org Renamed',
        ]));
        $this->assertSame('Second Org Renamed', $updated['name']);

        $service->destroy(Organization::find($created['id']));
        $this->assertSame(1, $service->index(new Request)['meta']['total']);
    }

    public function test_license_service_generates_number_and_links_org(): void
    {
        $service = app(LicenseService::class);

        $request = StoreLicenseRequest::create('/api/licenses', 'POST', [
            'customer_id' => $this->customerId,
            'organization_id' => $this->organization->id,
            'status' => 'active',
            'plan' => 'enterprise',
            'max_users' => 50,
        ]);
        $request->setContainer(app());
        $request->validateResolved();

        $license = $service->store($request);

        $this->assertStringStartsWith('LIC-', $license['license_number']);
        $this->assertSame('enterprise', $license['plan']);
        $this->assertSame('Acme Corp', $license['organization']['name']);
    }

    public function test_roles_are_organization_scoped_unique(): void
    {
        DB::table('roles')->insert([
            'name' => 'Admin',
            'slug' => 'admin',
            'organization_id' => $this->organization->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $secondOrg = Organization::query()->create(['name' => 'Other Org', 'status' => 'active']);

        // Same name in a different org is allowed.
        DB::table('roles')->insert([
            'name' => 'Admin',
            'slug' => 'admin',
            'organization_id' => $secondOrg->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->assertDatabaseCount('roles', 2);

        // Adding a role with an existing org + name should violate the composite unique.
        try {
            DB::table('roles')->insert([
                'name' => 'Admin',
                'slug' => 'admin',
                'organization_id' => $this->organization->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->fail('Expected duplicate role to be rejected.');
        } catch (QueryException $e) {
            $this->assertNotNull($e);
        }
    }
}
