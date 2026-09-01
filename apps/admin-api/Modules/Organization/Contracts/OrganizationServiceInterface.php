<?php

namespace Modules\Organization\Contracts;

use Illuminate\Http\Request;
use Modules\Organization\Http\Requests\StoreOrganizationRequest;
use Modules\Organization\Http\Requests\UpdateOrganizationRequest;
use Modules\Organization\Models\Organization;

interface OrganizationServiceInterface
{
    public function index(Request $request): array;

    public function show(Organization $organization): array;

    public function store(StoreOrganizationRequest $request): array;

    public function update(Organization $organization, UpdateOrganizationRequest $request): array;

    public function destroy(Organization $organization): void;
}
