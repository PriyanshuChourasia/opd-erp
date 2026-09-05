<?php

namespace Modules\ApplicationModule\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\ApplicationModule\Services\ApplicationModuleService;
use Modules\ApplicationModule\Http\Requests\StoreApplicationModuleRequest;
use Modules\ApplicationModule\Http\Requests\UpdateApplicationModuleRequest;

class ApplicationModuleController
{
    public function __construct(private readonly ApplicationModuleService $service)
    {
    }

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->service->index($request));
    }

    public function store(StoreApplicationModuleRequest $request): JsonResponse
    {
        return response()->json($this->service->store($request), 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json($this->service->show($id));
    }

    public function update(int $id, UpdateApplicationModuleRequest $request): JsonResponse
    {
        return response()->json($this->service->update($id, $request));
    }

    public function destroy(int $id): JsonResponse
    {
        $this->service->destroy($id);

        return response()->json(null, 204);
    }
}