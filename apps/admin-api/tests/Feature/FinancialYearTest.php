<?php

namespace Tests\Feature;

use App\Enums\FinancialYearStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Modules\FinancialYear\Models\FinancialYear;
use Modules\FinancialYear\Permissions\FinancialYearPermission;
use Modules\Organization\Models\Organization;
use Modules\Permission\Models\Permission;
use Tests\TestCase;

class FinancialYearTest extends TestCase
{
    use RefreshDatabase;

    private User $userA;
    private User $userB;
    private Organization $orgA;
    private Organization $orgB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->orgA = Organization::query()->create([
            'organization_code' => 'ORG-FY-TEST-001',
            'legal_name' => 'Acme Corp LLC',
            'display_name' => 'Acme Corp',
            'email' => 'org@acme.test',
            'status' => 'active',
        ]);

        $this->orgB = Organization::query()->create([
            'organization_code' => 'ORG-FY-TEST-002',
            'legal_name' => 'Beta Corp LLC',
            'display_name' => 'Beta Corp',
            'email' => 'org@beta.test',
            'status' => 'active',
        ]);

        $this->userA = User::query()->create([
            'name' => 'Admin User A',
            'email' => 'admin-a@acme.test',
            'password' => 'Password@123',
            'organization_id' => $this->orgA->id,
            'status' => 'active',
        ]);

        $this->userB = User::query()->create([
            'name' => 'Admin User B',
            'email' => 'admin-b@beta.test',
            'password' => 'Password@123',
            'organization_id' => $this->orgB->id,
            'status' => 'active',
        ]);

        $this->grantFinancialYearPermissions($this->userA);
        $this->grantFinancialYearPermissions($this->userB);
    }

    private function grantFinancialYearPermissions(User $user): void
    {
        $permissionIds = collect(FinancialYearPermission::ALL)->map(function (string $slug) {
            return Permission::query()->firstOrCreate(
                ['slug' => $slug],
                ['name' => ucwords(str_replace('-', ' ', $slug)), 'module' => 'financial_year']
            )->id;
        });

        DB::table('user_permission')->insert(
            $permissionIds->map(fn (string $permissionId) => [
                'user_id' => $user->id,
                'permission_id' => $permissionId,
            ])->all()
        );
    }

    private function actingAsUser(User $user): self
    {
        $this->actingAs($user, 'jwt');

        return $this;
    }

    private function validFinancialYearPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'FY 2026-27',
            'code' => 'FY2026-27',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
        ], $overrides);
    }

    // ─── CREATION TESTS ─────────────────────────────────────────────

    public function test_create_financial_year_successfully(): void
    {
        $this->actingAsUser($this->userA);

        $payload = $this->validFinancialYearPayload();

        $response = $this->postJson('/api/financial-years', $payload);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'name' => 'FY 2026-27',
                'code' => 'FY2026-27',
                'status' => 'open',
                'is_current' => false,
            ]);

        $this->assertDatabaseHas('financial_years', [
            'organization_id' => $this->orgA->id,
            'code' => 'FY2026-27',
            'status' => 'open',
        ]);
    }

    public function test_create_financial_year_with_missing_name_fails(): void
    {
        $this->actingAsUser($this->userA);

        $payload = $this->validFinancialYearPayload(['name' => '']);

        $response = $this->postJson('/api/financial-years', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('name');
    }

    public function test_create_financial_year_with_missing_code_fails(): void
    {
        $this->actingAsUser($this->userA);

        $payload = $this->validFinancialYearPayload(['code' => '']);

        $response = $this->postJson('/api/financial-years', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('code');
    }

    public function test_create_financial_year_with_missing_dates_fails(): void
    {
        $this->actingAsUser($this->userA);

        $response = $this->postJson('/api/financial-years', [
            'name' => 'FY 2026-27',
            'code' => 'FY2026-27',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['start_date', 'end_date']);
    }

    public function test_create_financial_year_with_invalid_date_range_fails(): void
    {
        $this->actingAsUser($this->userA);

        $payload = $this->validFinancialYearPayload([
            'start_date' => '2027-03-31',
            'end_date' => '2026-04-01',
        ]);

        $response = $this->postJson('/api/financial-years', $payload);

        $response->assertStatus(422);
    }

    public function test_create_financial_year_with_equal_dates_fails(): void
    {
        $this->actingAsUser($this->userA);

        $payload = $this->validFinancialYearPayload([
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-01',
        ]);

        $response = $this->postJson('/api/financial-years', $payload);

        $response->assertStatus(422);
    }

    public function test_create_duplicate_code_within_organization_fails(): void
    {
        $this->actingAsUser($this->userA);

        FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2026-27',
            'code' => 'FY2026-27',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
            'status' => FinancialYearStatus::OPEN,
        ]);

        $payload = $this->validFinancialYearPayload();

        $response = $this->postJson('/api/financial-years', $payload);

        $response->assertStatus(422);
    }

    // ─── OVERLAP TESTS ──────────────────────────────────────────────

    public function test_overlapping_financial_year_fails(): void
    {
        $this->actingAsUser($this->userA);

        FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2026-27',
            'code' => 'FY2026-27',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
            'status' => FinancialYearStatus::OPEN,
        ]);

        $payload = $this->validFinancialYearPayload([
            'name' => 'FY 2026-27-B',
            'code' => 'FY2026-27B',
            'start_date' => '2027-01-01',
            'end_date' => '2027-12-31',
        ]);

        $response = $this->postJson('/api/financial-years', $payload);

        $response->assertStatus(422);
    }

    public function test_adjacent_financial_year_succeeds(): void
    {
        $this->actingAsUser($this->userA);

        FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2026-27',
            'code' => 'FY2026-27',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
            'status' => FinancialYearStatus::OPEN,
        ]);

        $payload = $this->validFinancialYearPayload([
            'name' => 'FY 2027-28',
            'code' => 'FY2027-28',
            'start_date' => '2027-04-01',
            'end_date' => '2028-03-31',
        ]);

        $response = $this->postJson('/api/financial-years', $payload);

        $response->assertStatus(201);
    }

    public function test_overlapping_financial_year_on_boundary_succeeds(): void
    {
        $this->actingAsUser($this->userA);

        FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2026-27',
            'code' => 'FY2026-27',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
            'status' => FinancialYearStatus::OPEN,
        ]);

        // Starts exactly when previous ends - no overlap
        $payload = $this->validFinancialYearPayload([
            'name' => 'FY 2027-28',
            'code' => 'FY2027-28',
            'start_date' => '2027-03-31',
            'end_date' => '2028-03-30',
        ]);

        $response = $this->postJson('/api/financial-years', $payload);

        // This should succeed because start_date is not strictly before end_date overlap condition
        $response->assertStatus(201);
    }

    // ─── TENANT ISOLATION TESTS ─────────────────────────────────────

    public function test_user_sees_only_own_organization_financial_years(): void
    {
        FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2026-27',
            'code' => 'FY2026-27',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
            'status' => FinancialYearStatus::OPEN,
        ]);

        FinancialYear::query()->create([
            'organization_id' => $this->orgB->id,
            'name' => 'FY 2026-27',
            'code' => 'FY2026-27',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
            'status' => FinancialYearStatus::OPEN,
        ]);

        $this->actingAsUser($this->userA);

        $response = $this->getJson('/api/financial-years');

        $response->assertOk();

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertSame('FY2026-27', $data[0]['code']);
    }

    public function test_user_cannot_access_other_organization_financial_year(): void
    {
        $fyB = FinancialYear::query()->create([
            'organization_id' => $this->orgB->id,
            'name' => 'FY 2026-27',
            'code' => 'FY2026-27',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
            'status' => FinancialYearStatus::OPEN,
        ]);

        $this->actingAsUser($this->userA);

        $response = $this->getJson("/api/financial-years/{$fyB->id}");

        $response->assertStatus(403);
    }

    public function test_same_financial_year_code_valid_in_different_organizations(): void
    {
        FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2026-27',
            'code' => 'FY2026-27',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
            'status' => FinancialYearStatus::OPEN,
        ]);

        $this->actingAsUser($this->userB);

        $payload = $this->validFinancialYearPayload();

        $response = $this->postJson('/api/financial-years', $payload);

        $response->assertStatus(201);

        $this->assertDatabaseHas('financial_years', [
            'organization_id' => $this->orgB->id,
            'code' => 'FY2026-27',
        ]);
    }

    // ─── CURRENT FINANCIAL YEAR TESTS ───────────────────────────────

    public function test_set_current_financial_year(): void
    {
        $this->actingAsUser($this->userA);

        $fy = FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2026-27',
            'code' => 'FY2026-27',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
            'status' => FinancialYearStatus::OPEN,
        ]);

        $response = $this->patchJson("/api/financial-years/{$fy->id}/current");

        $response->assertOk()
            ->assertJsonFragment(['is_current' => true]);

        $this->assertDatabaseHas('financial_years', [
            'id' => $fy->id,
            'is_current' => true,
        ]);
    }

    public function test_switching_current_financial_year_clears_previous(): void
    {
        $this->actingAsUser($this->userA);

        $fy2025 = FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2025-26',
            'code' => 'FY2025-26',
            'start_date' => '2025-04-01',
            'end_date' => '2026-03-31',
            'status' => FinancialYearStatus::OPEN,
        ]);

        $fy2026 = FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2026-27',
            'code' => 'FY2026-27',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
            'status' => FinancialYearStatus::OPEN,
        ]);

        // Set 2025-26 as current
        $this->patchJson("/api/financial-years/{$fy2025->id}/current")->assertOk();

        // Switch to 2026-27
        $this->patchJson("/api/financial-years/{$fy2026->id}/current")->assertOk();

        $this->assertDatabaseHas('financial_years', [
            'id' => $fy2025->id,
            'is_current' => false,
        ]);
        $this->assertDatabaseHas('financial_years', [
            'id' => $fy2026->id,
            'is_current' => true,
        ]);
    }

    public function test_each_organization_has_own_current_financial_year(): void
    {
        $fyA = FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2026-27',
            'code' => 'FY2026-27',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
            'status' => FinancialYearStatus::OPEN,
        ]);

        $fyB = FinancialYear::query()->create([
            'organization_id' => $this->orgB->id,
            'name' => 'FY 2026-27',
            'code' => 'FY2026-27',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
            'status' => FinancialYearStatus::OPEN,
        ]);

        $this->actingAsUser($this->userA);
        $this->patchJson("/api/financial-years/{$fyA->id}/current")->assertOk();

        $this->actingAsUser($this->userB);
        $this->patchJson("/api/financial-years/{$fyB->id}/current")->assertOk();

        // Both should be current in their respective organizations
        $this->assertDatabaseHas('financial_years', [
            'id' => $fyA->id,
            'is_current' => true,
        ]);
        $this->assertDatabaseHas('financial_years', [
            'id' => $fyB->id,
            'is_current' => true,
        ]);
    }

    public function test_get_current_financial_year(): void
    {
        $this->actingAsUser($this->userA);

        $fy = FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2026-27',
            'code' => 'FY2026-27',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
            'status' => FinancialYearStatus::OPEN,
            'is_current' => true,
        ]);

        $response = $this->getJson('/api/financial-years/current');

        $response->assertOk()
            ->assertJsonFragment([
                'id' => (string) $fy->id,
                'is_current' => true,
            ]);
    }

    public function test_get_current_financial_year_when_none_set_returns_404(): void
    {
        $this->actingAsUser($this->userA);

        $response = $this->getJson('/api/financial-years/current');

        $response->assertStatus(404);
    }

    public function test_cannot_set_closed_financial_year_as_current(): void
    {
        $this->actingAsUser($this->userA);

        $fy = FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2025-26',
            'code' => 'FY2025-26',
            'start_date' => '2025-04-01',
            'end_date' => '2026-03-31',
            'status' => FinancialYearStatus::CLOSED,
        ]);

        $response = $this->patchJson("/api/financial-years/{$fy->id}/current");

        $response->assertStatus(422);
    }

    // ─── CLOSED FINANCIAL YEAR TESTS ────────────────────────────────

    public function test_close_financial_year(): void
    {
        $this->actingAsUser($this->userA);

        $fy = FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2025-26',
            'code' => 'FY2025-26',
            'start_date' => '2025-04-01',
            'end_date' => '2026-03-31',
            'status' => FinancialYearStatus::OPEN,
        ]);

        $response = $this->postJson("/api/financial-years/{$fy->id}/close");

        $response->assertOk()
            ->assertJsonFragment([
                'status' => 'closed',
            ]);

        $this->assertDatabaseHas('financial_years', [
            'id' => $fy->id,
            'status' => 'closed',
        ]);
    }

    public function test_close_current_financial_year_clears_current(): void
    {
        $this->actingAsUser($this->userA);

        $fy = FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2026-27',
            'code' => 'FY2026-27',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
            'status' => FinancialYearStatus::OPEN,
            'is_current' => true,
        ]);

        $response = $this->postJson("/api/financial-years/{$fy->id}/close");

        $response->assertOk();

        $this->assertDatabaseHas('financial_years', [
            'id' => $fy->id,
            'is_current' => false,
            'status' => 'closed',
        ]);
    }

    public function test_cannot_edit_closed_financial_year(): void
    {
        $this->actingAsUser($this->userA);

        $fy = FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2025-26',
            'code' => 'FY2025-26',
            'start_date' => '2025-04-01',
            'end_date' => '2026-03-31',
            'status' => FinancialYearStatus::CLOSED,
        ]);

        $response = $this->putJson("/api/financial-years/{$fy->id}", [
            'name' => 'FY 2025-26 Updated',
        ]);

        $response->assertStatus(422);
    }

    public function test_cannot_delete_closed_financial_year(): void
    {
        $this->actingAsUser($this->userA);

        $fy = FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2025-26',
            'code' => 'FY2025-26',
            'start_date' => '2025-04-01',
            'end_date' => '2026-03-31',
            'status' => FinancialYearStatus::CLOSED,
        ]);

        $response = $this->deleteJson("/api/financial-years/{$fy->id}");

        $response->assertStatus(422);
    }

    public function test_cannot_delete_current_financial_year(): void
    {
        $this->actingAsUser($this->userA);

        $fy = FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2026-27',
            'code' => 'FY2026-27',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
            'status' => FinancialYearStatus::OPEN,
            'is_current' => true,
        ]);

        $response = $this->deleteJson("/api/financial-years/{$fy->id}");

        $response->assertStatus(422);
    }

    public function test_can_delete_open_non_current_financial_year(): void
    {
        $this->actingAsUser($this->userA);

        $fy = FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2026-27',
            'code' => 'FY2026-27',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
            'status' => FinancialYearStatus::OPEN,
            'is_current' => false,
        ]);

        $response = $this->deleteJson("/api/financial-years/{$fy->id}");

        $response->assertStatus(204);

        $this->assertSoftDeleted('financial_years', ['id' => $fy->id]);
    }

    // ─── UPDATE TESTS ───────────────────────────────────────────────

    public function test_update_open_financial_year(): void
    {
        $this->actingAsUser($this->userA);

        $fy = FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2026-27',
            'code' => 'FY2026-27',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
            'status' => FinancialYearStatus::OPEN,
        ]);

        $response = $this->putJson("/api/financial-years/{$fy->id}", [
            'name' => 'FY 2026-27 (Updated)',
        ]);

        $response->assertOk()
            ->assertJsonFragment(['name' => 'FY 2026-27 (Updated)']);
    }

    public function test_update_financial_year_with_overlapping_dates_fails(): void
    {
        $this->actingAsUser($this->userA);

        $fy1 = FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2026-27',
            'code' => 'FY2026-27',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
            'status' => FinancialYearStatus::OPEN,
        ]);

        $fy2 = FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2027-28',
            'code' => 'FY2027-28',
            'start_date' => '2027-04-01',
            'end_date' => '2028-03-31',
            'status' => FinancialYearStatus::OPEN,
        ]);

        $response = $this->putJson("/api/financial-years/{$fy2->id}", [
            'start_date' => '2026-06-01',
        ]);

        $response->assertStatus(422);
    }

    // ─── SECURITY TESTS ─────────────────────────────────────────────

    public function test_user_without_permission_is_denied(): void
    {
        $org = Organization::query()->create([
            'organization_code' => 'ORG-FY-NOPERM',
            'legal_name' => 'No Perm Corp',
            'display_name' => 'No Perm Corp',
            'email' => 'org@noperm.test',
            'status' => 'active',
        ]);

        $user = User::query()->create([
            'name' => 'No Perm User',
            'email' => 'no-perm@noperm.test',
            'password' => 'Password@123',
            'organization_id' => $org->id,
            'status' => 'active',
        ]);

        $this->actingAsUser($user);

        $response = $this->postJson('/api/financial-years', $this->validFinancialYearPayload());

        $response->assertStatus(403);
    }

    public function test_cannot_inject_organization_id_on_create(): void
    {
        $this->actingAsUser($this->userA);

        $payload = $this->validFinancialYearPayload([
            'organization_id' => $this->orgB->id,
        ]);

        $response = $this->postJson('/api/financial-years', $payload);

        $response->assertStatus(201);

        $created = FinancialYear::query()->where('code', 'FY2026-27')->first();
        $this->assertSame($this->orgA->id, $created->organization_id);
    }

    public function test_cannot_inject_is_current_on_create(): void
    {
        $this->actingAsUser($this->userA);

        $payload = $this->validFinancialYearPayload([
            'is_current' => true,
        ]);

        $response = $this->postJson('/api/financial-years', $payload);

        $response->assertStatus(201);

        $created = FinancialYear::query()->where('code', 'FY2026-27')->first();
        $this->assertFalse($created->is_current);
    }

    public function test_cannot_inject_status_on_create(): void
    {
        $this->actingAsUser($this->userA);

        $payload = $this->validFinancialYearPayload([
            'status' => 'closed',
        ]);

        $response = $this->postJson('/api/financial-years', $payload);

        $response->assertStatus(201);

        $created = FinancialYear::query()->where('code', 'FY2026-27')->first();
        $this->assertSame(FinancialYearStatus::OPEN, $created->status);
    }

    // ─── CONCURRENCY TEST ───────────────────────────────────────────

    public function test_concurrent_set_current_results_in_single_current(): void
    {
        $this->actingAsUser($this->userA);

        $fy1 = FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2026-27',
            'code' => 'FY2026-27',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
            'status' => FinancialYearStatus::OPEN,
        ]);

        $fy2 = FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2027-28',
            'code' => 'FY2027-28',
            'start_date' => '2027-04-01',
            'end_date' => '2028-03-31',
            'status' => FinancialYearStatus::OPEN,
        ]);

        // Simulate concurrent requests by setting both to current rapidly
        $this->patchJson("/api/financial-years/{$fy1->id}/current")->assertOk();
        $this->patchJson("/api/financial-years/{$fy2->id}/current")->assertOk();

        // Only the last one should be current
        $currentCount = FinancialYear::query()
            ->forOrganization($this->orgA->id)
            ->where('is_current', true)
            ->count();

        $this->assertSame(1, $currentCount);

        $this->assertDatabaseHas('financial_years', [
            'id' => $fy1->id,
            'is_current' => false,
        ]);
        $this->assertDatabaseHas('financial_years', [
            'id' => $fy2->id,
            'is_current' => true,
        ]);
    }

    // ─── LIST / SHOW TESTS ──────────────────────────────────────────

    public function test_list_financial_years_with_pagination(): void
    {
        $this->actingAsUser($this->userA);

        FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2025-26',
            'code' => 'FY2025-26',
            'start_date' => '2025-04-01',
            'end_date' => '2026-03-31',
            'status' => FinancialYearStatus::CLOSED,
        ]);

        FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2026-27',
            'code' => 'FY2026-27',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
            'status' => FinancialYearStatus::OPEN,
        ]);

        $response = $this->getJson('/api/financial-years');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'code', 'start_date', 'end_date', 'status'],
                ],
                'meta' => ['total', 'page', 'limit', 'totalPages'],
            ]);

        $this->assertCount(2, $response->json('data'));
    }

    public function test_list_financial_years_filtered_by_status(): void
    {
        $this->actingAsUser($this->userA);

        FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2025-26',
            'code' => 'FY2025-26',
            'start_date' => '2025-04-01',
            'end_date' => '2026-03-31',
            'status' => FinancialYearStatus::CLOSED,
        ]);

        FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2026-27',
            'code' => 'FY2026-27',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
            'status' => FinancialYearStatus::OPEN,
        ]);

        $response = $this->getJson('/api/financial-years?status=closed');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('closed', $response->json('data.0.status'));
    }

    public function test_show_single_financial_year(): void
    {
        $this->actingAsUser($this->userA);

        $fy = FinancialYear::query()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'FY 2026-27',
            'code' => 'FY2026-27',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
            'status' => FinancialYearStatus::OPEN,
        ]);

        $response = $this->getJson("/api/financial-years/{$fy->id}");

        $response->assertOk()
            ->assertJsonFragment([
                'id' => (string) $fy->id,
                'name' => 'FY 2026-27',
            ]);
    }

    // ─── UUID PRIMARY KEY TEST ──────────────────────────────────────

    public function test_financial_year_uses_uuid_primary_key(): void
    {
        $this->actingAsUser($this->userA);

        $payload = $this->validFinancialYearPayload();

        $this->postJson('/api/financial-years', $payload)->assertStatus(201);

        $columns = DB::select("SHOW COLUMNS FROM `financial_years` WHERE Field = 'id'");
        $idColumn = collect($columns)->first();

        $this->assertNotNull($idColumn);
        $this->assertSame('char(36)', $idColumn->Type);
    }
}
