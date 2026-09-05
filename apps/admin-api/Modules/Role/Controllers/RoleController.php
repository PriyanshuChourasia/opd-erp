<?php

namespace Modules\Role\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Role\Services\RoleService;
use Modules\Role\Http\Requests\StoreRoleRequest;
use Modules\Role\Http\Requests\UpdateRoleRequest;

class RoleController
{
    public function __construct(private readonly RoleService $service)
    {
    }

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->service->index($request));
    }

    public function store(StoreRoleRequest $request): JsonResponse
    {
        return response()->json($this->service->store($request), 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json($this->service->show($id));
    }

    public function update(int $id, UpdateRoleRequest $request): JsonResponse
    {
        return response()->json($this->service->update($id, $request));
    }

    public function destroy(int $id): JsonResponse
    {
        $this->service->destroy($id);

        return response()->json(null, 204);
    }
}