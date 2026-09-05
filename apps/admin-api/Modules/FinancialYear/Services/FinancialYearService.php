<?php

namespace Modules\FinancialYear\Services;

use App\Enums\FinancialYearStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Modules\FinancialYear\Audit\FinancialYearAuditEvent;
use Modules\FinancialYear\Contracts\FinancialYearServiceInterface;
use Modules\FinancialYear\Http\Requests\StoreFinancialYearRequest;
use Modules\FinancialYear\Http\Requests\UpdateFinancialYearRequest;
use Modules\FinancialYear\Models\FinancialYear;
use Modules\Organization\Services\TenantContext;
use Symfony\Component\HttpKernel\Exception\HttpException;

class FinancialYearService implements FinancialYearServiceInterface
{
    public function __construct(
        private readonly TenantContext $tenantContext,
    ) {}

    public function index(Request $request): array
    {
        $organization = $this->tenantContext->organization();
        $this->assertOrganization($organization);

        $limit = min(max((int) $request->input('limit', 10), 1), 100);
        $page = max((int) $request->input('page', 1), 1);

        $query = FinancialYear::query()->forOrganization($organization->id);

        $search = trim((string) $request->input('search', ''));
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $status = $request->input('status');
        if (in_array($status, ['open', 'closed'], true)) {
            $query->where('status', $status);
        }

        $paginator = $query->latest('start_date')->paginate($limit, ['*'], 'page', $page);

        return [
            'data' => collect($paginator->items())->map(fn (FinancialYear $fy) => $this->toArray($fy))->values(),
            'meta' => [
                'total' => $paginator->total(),
                'page' => $paginator->currentPage(),
                'limit' => $paginator->perPage(),
                'totalPages' => $paginator->lastPage(),
            ],
        ];
    }

    public function show(FinancialYear $financialYear): array
    {
        $this->assertBelongsToCurrentOrganization($financialYear);

        return $this->toArray($financialYear);
    }

    public function store(StoreFinancialYearRequest $request): array
    {
        $organization = $this->tenantContext->organization();
        $this->assertOrganization($organization);

        $data = $request->validated();

        $this->validateDateRange($data['start_date'], $data['end_date']);
        $this->assertNoOverlap($organization->id, $data['start_date'], $data['end_date']);
        $this->assertCodeUniqueWithinOrganization($organization->id, $data['code']);

        $financialYear = FinancialYear::query()->create([
            'organization_id' => $organization->id,
            'name' => $data['name'],
            'code' => $data['code'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'status' => FinancialYearStatus::OPEN,
            'is_current' => false,
        ]);

        Event::dispatch(FinancialYearAuditEvent::CREATED, [$financialYear]);

        return $this->toArray($financialYear);
    }

    public function update(FinancialYear $financialYear, UpdateFinancialYearRequest $request): array
    {
        $this->assertBelongsToCurrentOrganization($financialYear);
        $this->assertIsOpen($financialYear);

        $data = $request->validated();
        $organization = $this->tenantContext->organization();

        $startDate = $data['start_date'] ?? $financialYear->start_date->toDateString();
        $endDate = $data['end_date'] ?? $financialYear->end_date->toDateString();

        $this->validateDateRange($startDate, $endDate);

        if (isset($data['start_date']) || isset($data['end_date'])) {
            $this->assertNoOverlap($organization->id, $startDate, $endDate, $financialYear->id);
        }

        if (isset($data['code'])) {
            $this->assertCodeUniqueWithinOrganization($organization->id, $data['code'], $financialYear->id);
        }

        $financialYear->update($data);

        Event::dispatch(FinancialYearAuditEvent::UPDATED, [$financialYear->fresh()]);

        return $this->toArray($financialYear->fresh());
    }

    public function destroy(FinancialYear $financialYear): void
    {
        $this->assertBelongsToCurrentOrganization($financialYear);

        if ($financialYear->status === FinancialYearStatus::CLOSED) {
            throw new HttpException(422, 'Cannot delete a closed financial year.');
        }

        if ($financialYear->is_current) {
            throw new HttpException(422, 'Cannot delete the current financial year.');
        }

        $financialYear->delete();

        Event::dispatch(FinancialYearAuditEvent::DELETED, [$financialYear]);
    }

    public function current(): array
    {
        $organization = $this->tenantContext->organization();
        $this->assertOrganization($organization);

        $financialYear = FinancialYear::query()
            ->forOrganization($organization->id)
            ->current()
            ->first();

        if (! $financialYear) {
            throw new HttpException(404, 'No current financial year set for this organization.');
        }

        return $this->toArray($financialYear);
    }

    public function setCurrent(FinancialYear $financialYear): array
    {
        $this->assertBelongsToCurrentOrganization($financialYear);
        $this->assertIsOpen($financialYear);

        $organization = $this->tenantContext->organization();

        DB::transaction(function () use ($financialYear, $organization) {
            FinancialYear::query()
                ->forOrganization($organization->id)
                ->where('is_current', true)
                ->update(['is_current' => false]);

            $financialYear->update(['is_current' => true]);
        });

        Event::dispatch(FinancialYearAuditEvent::SET_CURRENT, [$financialYear->fresh()]);

        return $this->toArray($financialYear->fresh());
    }

    public function close(FinancialYear $financialYear): array
    {
        $this->assertBelongsToCurrentOrganization($financialYear);
        $this->assertIsOpen($financialYear);

        $user = $this->tenantContext->user();

        DB::transaction(function () use ($financialYear, $user) {
            if ($financialYear->is_current) {
                $financialYear->update([
                    'is_current' => false,
                ]);
            }

            $financialYear->update([
                'status' => FinancialYearStatus::CLOSED,
                'closed_at' => now(),
                'closed_by' => $user?->id,
            ]);
        });

        Event::dispatch(FinancialYearAuditEvent::CLOSED, [$financialYear->fresh()]);

        return $this->toArray($financialYear->fresh());
    }

    private function validateDateRange(string $startDate, string $endDate): void
    {
        if ( strtotime($startDate) >= strtotime($endDate)) {
            throw new HttpException(422, 'The start date must be before the end date.');
        }
    }

    private function assertNoOverlap(string $organizationId, string $startDate, string $endDate, ?string $excludeId = null): void
    {
        $query = FinancialYear::query()
            ->forOrganization($organizationId)
            ->where('start_date', '<', $endDate)
            ->where('end_date', '>', $startDate);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        if ($query->exists()) {
            throw new HttpException(422, 'The financial year dates overlap with an existing financial year.');
        }
    }

    private function assertCodeUniqueWithinOrganization(string $organizationId, string $code, ?string $excludeId = null): void
    {
        $query = FinancialYear::query()
            ->forOrganization($organizationId)
            ->where('code', $code);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        if ($query->exists()) {
            throw new HttpException(422, "A financial year with code '{$code}' already exists in this organization.");
        }
    }

    private function assertOrganization(?object $organization): void
    {
        if (! $organization) {
            throw new HttpException(403, 'No organization context available.');
        }
    }

    private function assertBelongsToCurrentOrganization(FinancialYear $financialYear): void
    {
        $organization = $this->tenantContext->organization();
        $this->assertOrganization($organization);

        if ($financialYear->organization_id !== $organization->id) {
            throw new HttpException(403, 'This financial year does not belong to your organization.');
        }
    }

    private function assertIsOpen(FinancialYear $financialYear): void
    {
        if ($financialYear->status !== FinancialYearStatus::OPEN) {
            throw new HttpException(422, 'This financial year is not open.');
        }
    }

    private function toArray(FinancialYear $financialYear): array
    {
        return [
            'id' => (string) $financialYear->id,
            'organization_id' => (string) $financialYear->organization_id,
            'name' => $financialYear->name,
            'code' => $financialYear->code,
            'start_date' => $financialYear->start_date->toDateString(),
            'end_date' => $financialYear->end_date->toDateString(),
            'status' => $financialYear->status->value,
            'is_current' => $financialYear->is_current,
            'closed_at' => $financialYear->closed_at?->toIso8601String(),
            'closed_by' => $financialYear->closed_by ? (string) $financialYear->closed_by : null,
            'createdAt' => $financialYear->created_at?->toIso8601String(),
            'updatedAt' => $financialYear->updated_at?->toIso8601String(),
        ];
    }
}
