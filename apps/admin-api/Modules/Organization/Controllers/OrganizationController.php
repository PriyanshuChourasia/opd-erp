<?php

namespace Modules\Organization\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Organization\Contracts\OrganizationServiceInterface;
use Modules\Organization\Http\Requests\StoreOrganizationRequest;
use Modules\Organization\Http\Requests\UpdateOrganizationRequest;
use Modules\Organization\Models\Organization;

class OrganizationController
{
    public function __construct(private readonly OrganizationServiceInterface $service) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->service->index($request));
    }

    public function store(StoreOrganizationRequest $request): JsonResponse
    {
        return response()->json($this->service->store($request), 201);
    }

    public function show(Organization $organization): JsonResponse
    {
        return response()->json($this->service->show($organization));
    }

    public function update(Organization $organization, UpdateOrganizationRequest $request): JsonResponse
    {
        return response()->json($this->service->update($organization, $request));
    }

    public function destroy(Organization $organization): JsonResponse
    {
        $this->service->destroy($organization);

        return response()->json(null, 204);
    }
}
