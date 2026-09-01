<?php

namespace Modules\Organization\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Organization\Contracts\OrganizationServiceInterface;
use Modules\Organization\Http\Requests\StoreOrganizationRequest;
use Modules\Organization\Http\Requests\UpdateOrganizationRequest;
use Modules\Organization\Models\Organization;
use Symfony\Component\HttpKernel\Exception\HttpException;

class OrganizationService implements OrganizationServiceInterface
{
    public function index(Request $request): array
    {
        $limit = min(max((int) $request->input('limit', 10), 1), 100);
        $page = max((int) $request->input('page', 1), 1);

        $query = Organization::query();

        $search = trim((string) $request->input('search', ''));
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('legal_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $status = $request->input('status');
        if (in_array($status, ['active', 'inactive'], true)) {
            $query->where('status', $status);
        }

        $paginator = $query->latest('id')->paginate($limit, ['*'], 'page', $page);

        return [
            'data' => collect($paginator->items())->map(fn (Organization $org) => $this->toArray($org))->values(),
            'meta' => [
                'total' => $paginator->total(),
                'page' => $paginator->currentPage(),
                'limit' => $paginator->perPage(),
                'totalPages' => $paginator->lastPage(),
            ],
        ];
    }

    public function show(Organization $organization): array
    {
        return $this->toArray($organization);
    }

    public function store(StoreOrganizationRequest $request): array
    {
        $name = trim((string) $request->input('name'));
        if (Organization::query()->where('name', $name)->exists()) {
            throw new HttpException(422, "An organization named '{$name}' already exists.");
        }

        $org = Organization::query()->create($request->validated());

        return $this->toArray($org);
    }

    public function update(Organization $organization, UpdateOrganizationRequest $request): array
    {
        $data = $request->validated();

        $name = trim((string) ($data['name'] ?? $organization->name));
        $exists = Organization::query()
            ->where('name', $name)
            ->where('id', '!=', $organization->id)
            ->exists();
        if ($exists) {
            throw new HttpException(422, "An organization named '{$name}' already exists.");
        }

        $organization->update($data);

        return $this->toArray($organization);
    }

    public function destroy(Organization $organization): void
    {
        $userCount = DB::table('users')->where('organization_id', $organization->id)->count();
        if ($userCount > 0) {
            throw new HttpException(422, 'Cannot delete an organization that has users.');
        }

        $organization->delete();
    }

    private function toArray(Organization $organization): array
    {
        return [
            'id' => (string) $organization->id,
            'name' => $organization->name,
            'legal_name' => $organization->legal_name,
            'registration_number' => $organization->registration_number,
            'email' => $organization->email,
            'phone' => $organization->phone,
            'address' => $organization->address,
            'city' => $organization->city,
            'state' => $organization->state,
            'country' => $organization->country,
            'pincode' => $organization->pincode,
            'timezone' => $organization->timezone,
            'locale' => $organization->locale,
            'currency' => $organization->currency,
            'status' => $organization->status,
            'createdAt' => $organization->created_at?->toIso8601String(),
        ];
    }
}
