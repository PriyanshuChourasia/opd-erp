<?php

namespace Modules\UserPermission\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\UserPermission\Services\UserPermissionService;
use Modules\UserPermission\Http\Requests\StoreUserPermissionRequest;

class UserPermissionController
{
    public function __construct(private readonly UserPermissionService $service)
    {
    }

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->service->index($request));
    }

    public function store(StoreUserPermissionRequest $request): JsonResponse
    {
        return response()->json($this->service->store($request), 201);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->service->destroy($id);

        return response()->json(null, 204);
    }
}