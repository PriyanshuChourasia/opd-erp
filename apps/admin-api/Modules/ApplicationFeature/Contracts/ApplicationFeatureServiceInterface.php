<?php

namespace Modules\ApplicationFeature\Contracts;

use Illuminate\Http\Request;
use Modules\ApplicationFeature\Http\Requests\StoreApplicationFeatureRequest;
use Modules\ApplicationFeature\Http\Requests\UpdateApplicationFeatureRequest;

interface ApplicationFeatureServiceInterface
{
    public function index(Request $request): array;

    public function show(int $id): array;

    public function store(StoreApplicationFeatureRequest $request): array;

    public function update(int $id, UpdateApplicationFeatureRequest $request): array;

    public function destroy(int $id): void;
}