<?php

namespace Modules\UserRole\Contracts;

use Illuminate\Http\Request;
use Modules\UserRole\Http\Requests\StoreUserRoleRequest;

interface UserRoleServiceInterface
{
    public function index(Request $request): array;

    public function store(StoreUserRoleRequest $request): array;

    public function destroy(int $id): void;
}