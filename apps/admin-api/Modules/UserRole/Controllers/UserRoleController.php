<?php

namespace Modules\UserRole\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\UserRole\Services\UserRoleService;
use Modules\UserRole\Http\Requests\StoreUserRoleRequest;

class UserRoleController
{
    public function __construct(private readonly UserRoleService $service)
    {
    }

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->service->index($request));
    }

    public function store(StoreUserRoleRequest $request): JsonResponse
    {
        return response()->json($this->service->store($request), 201);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->service->destroy($id);

        return response()->json(null, 204);
    }
}