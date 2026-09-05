<?php

namespace Modules\ApplicationFeature\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\ApplicationFeature\Services\ApplicationFeatureService;
use Modules\ApplicationFeature\Http\Requests\StoreApplicationFeatureRequest;
use Modules\ApplicationFeature\Http\Requests\UpdateApplicationFeatureRequest;

class ApplicationFeatureController
{
    public function __construct(private readonly ApplicationFeatureService $service)
    {
    }

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->service->index($request));
    }

    public function store(StoreApplicationFeatureRequest $request): JsonResponse
    {
        return response()->json($this->service->store($request), 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json($this->service->show($id));
    }

    public function update(int $id, UpdateApplicationFeatureRequest $request): JsonResponse
    {
        return response()->json($this->service->update($id, $request));
    }

    public function destroy(int $id): JsonResponse
    {
        $this->service->destroy($id);

        return response()->json(null, 204);
    }
}