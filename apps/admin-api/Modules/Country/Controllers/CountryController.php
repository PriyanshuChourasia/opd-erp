<?php

namespace Modules\Country\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Country\Contracts\CountryServiceInterface;
use Modules\Country\Http\Requests\StoreCountryRequest;
use Modules\Country\Http\Requests\UpdateCountryRequest;

class CountryController
{
    public function __construct(private readonly CountryServiceInterface $service)
    {
    }

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->service->index($request));
    }

    public function store(StoreCountryRequest $request): JsonResponse
    {
        return response()->json($this->service->store($request), 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json($this->service->show($id));
    }

    public function update(int $id, UpdateCountryRequest $request): JsonResponse
    {
        return response()->json($this->service->update($id, $request));
    }

    public function destroy(int $id): JsonResponse
    {
        $this->service->destroy($id);

        return response()->json(null, 204);
    }
}