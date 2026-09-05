<?php

namespace Modules\License\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Modules\License\Contracts\LicenseServiceInterface;
use Modules\License\Http\Requests\StoreLicenseRequest;
use Modules\License\Http\Requests\UpdateLicenseRequest;
use Modules\License\Models\License;

class LicenseService implements LicenseServiceInterface
{
    public function index(Request $request): array
    {
        $limit = min(max((int) $request->input('limit', 10), 1), 100);
        $page = max((int) $request->input('page', 1), 1);

        $query = License::query()->with(['customer', 'organization']);

        if ($organizationId = $request->input('organization_id')) {
            $query->where('organization_id', (int) $organizationId);
        }

        if ($customerId = $request->input('customer_id')) {
            $query->where('customer_id', (int) $customerId);
        }

        $validStatuses = [
            License::STATUS_CREATED,
            License::STATUS_ACTIVE,
            License::STATUS_SUSPENDED,
            License::STATUS_EXPIRED,
            License::STATUS_REVOKED,
        ];

        $status = $request->input('status');
        if (in_array($status, $validStatuses, true)) {
            $query->where('status', $status);
        }

        $search = trim((string) $request->input('search', ''));
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('license_number', 'like', "%{$search}%");
            });
        }

        $paginator = $query->latest('id')->paginate($limit, ['*'], 'page', $page);

        return [
            'data' => collect($paginator->items())->map(fn (License $license) => $this->toArray($license))->values(),
            'meta' => [
                'total' => $paginator->total(),
                'page' => $paginator->currentPage(),
                'limit' => $paginator->perPage(),
                'totalPages' => $paginator->lastPage(),
            ],
        ];
    }

    public function show(License $license): array
    {
        $license->load(['customer', 'organization']);

        return $this->toArray($license);
    }

    public function store(StoreLicenseRequest $request): array
    {
        $data = $request->validated();
        $data['license_number'] = $this->generateLicenseNumber();
        $data['status'] = $data['status'] ?? License::STATUS_CREATED;

        if (($data['status'] ?? null) === License::STATUS_ACTIVE) {
            $data['start_date'] = $data['start_date'] ?? now()->toDateString();
            $data['issue_date'] = $data['issue_date'] ?? now()->toDateString();
        }

        $license = License::query()->create($data);
        $license->load(['customer', 'organization']);

        return $this->toArray($license);
    }

    public function update(License $license, UpdateLicenseRequest $request): array
    {
        $data = $request->validated();

        if (isset($data['license_number'])) {
            unset($data['license_number']);
        }

        if (($data['status'] ?? null) === License::STATUS_ACTIVE && ! $license->start_date) {
            $data['start_date'] = $data['start_date'] ?? now()->toDateString();
        }

        $license->update($data);
        $license->load(['customer', 'organization']);

        return $this->toArray($license);
    }

    public function destroy(License $license): void
    {
        $license->delete();
    }

    private function generateLicenseNumber(): string
    {
        do {
            $number = strtoupper('LIC-'.now()->format('Y').'-'.Str::upper(Str::random(8)));
        } while (License::query()->where('license_number', $number)->exists());

        return $number;
    }

    private function toArray(License $license): array
    {
        return [
            'id' => (string) $license->id,
            'license_number' => $license->license_number,
            'customer_id' => $license->customer_id ? (string) $license->customer_id : null,
            'customer' => $license->customer ? [
                'id' => (string) $license->customer->id,
                'name' => trim(($license->customer->first_name ?? '').' '.($license->customer->last_name ?? '')),
            ] : null,
            'organization_id' => $license->organization_id ? (string) $license->organization_id : null,
            'organization' => $license->organization ? [
                'id' => (string) $license->organization->id,
                'name' => $license->organization->name,
            ] : null,
            'status' => $license->status,
            'issue_date' => $license->issue_date?->toDateString(),
            'start_date' => $license->start_date?->toDateString(),
            'expiry_date' => $license->expiry_date?->toDateString(),
            'plan' => $license->plan,
            'max_users' => $license->max_users,
            'max_devices' => $license->max_devices,
            'features' => $license->features,
            'created_at' => $license->created_at?->toIso8601String(),
        ];
    }
}
