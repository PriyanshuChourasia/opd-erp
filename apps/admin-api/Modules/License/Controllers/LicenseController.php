<?php

namespace Modules\License\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\License\Contracts\LicenseServiceInterface;
use Modules\License\Http\Requests\StoreLicenseRequest;
use Modules\License\Http\Requests\UpdateLicenseRequest;
use Modules\License\Models\License;

class LicenseController
{
    public function __construct(private readonly LicenseServiceInterface $service) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->service->index($request));
    }

    public function store(StoreLicenseRequest $request): JsonResponse
    {
        return response()->json($this->service->store($request), 201);
    }

    public function show(License $license): JsonResponse
    {
        return response()->json($this->service->show($license));
    }

    public function update(License $license, UpdateLicenseRequest $request): JsonResponse
    {
        return response()->json($this->service->update($license, $request));
    }

    public function destroy(License $license): JsonResponse
    {
        $this->service->destroy($license);

        return response()->json(null, 204);
    }
}
