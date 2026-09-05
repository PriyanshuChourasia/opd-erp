<?php

namespace Modules\Permission\Contracts;

use Illuminate\Http\Request;
use Modules\Permission\Http\Requests\StorePermissionRequest;
use Modules\Permission\Http\Requests\UpdatePermissionRequest;

interface PermissionServiceInterface
{
    public function index(Request $request): array;

    public function show(int $id): array;

    public function store(StorePermissionRequest $request): array;

    public function update(int $id, UpdatePermissionRequest $request): array;

    public function destroy(int $id): void;
}