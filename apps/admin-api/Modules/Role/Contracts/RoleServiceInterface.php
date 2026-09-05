<?php

namespace Modules\Role\Contracts;

use Illuminate\Http\Request;
use Modules\Role\Http\Requests\StoreRoleRequest;
use Modules\Role\Http\Requests\UpdateRoleRequest;

interface RoleServiceInterface
{
    public function index(Request $request): array;

    public function show(int $id): array;

    public function store(StoreRoleRequest $request): array;

    public function update(int $id, UpdateRoleRequest $request): array;

    public function destroy(int $id): void;
}