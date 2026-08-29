<?php

namespace Modules\UserPermission\Contracts;

use Illuminate\Http\Request;
use Modules\UserPermission\Http\Requests\StoreUserPermissionRequest;

interface UserPermissionServiceInterface
{
    public function index(Request $request): array;

    public function store(StoreUserPermissionRequest $request): array;

    public function destroy(int $id): void;
}