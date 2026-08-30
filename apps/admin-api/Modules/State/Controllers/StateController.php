<?php

namespace Modules\State\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\State\Contracts\StateServiceInterface;
use Modules\State\Http\Requests\StoreStateRequest;
use Modules\State\Http\Requests\UpdateStateRequest;

class StateController
{
    public function __construct(private readonly StateServiceInterface $service)
    {
    }

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->service->index($request));
    }

    public function store(StoreStateRequest $request): JsonResponse
    {
        return response()->json($this->service->store($request), 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json($this->service->show($id));
    }

    public function update(int $id, UpdateStateRequest $request): JsonResponse
    {
        return response()->json($this->service->update($id, $request));
    }

    public function destroy(int $id): JsonResponse
    {
        $this->service->destroy($id);

        return response()->json(null, 204);
    }
}