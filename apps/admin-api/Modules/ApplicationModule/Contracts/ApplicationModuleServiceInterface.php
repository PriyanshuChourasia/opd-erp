<?php

namespace Modules\ApplicationModule\Contracts;

use Illuminate\Http\Request;
use Modules\ApplicationModule\Http\Requests\StoreApplicationModuleRequest;
use Modules\ApplicationModule\Http\Requests\UpdateApplicationModuleRequest;

interface ApplicationModuleServiceInterface
{
    public function index(Request $request): array;

    public function show(int $id): array;

    public function store(StoreApplicationModuleRequest $request): array;

    public function update(int $id, UpdateApplicationModuleRequest $request): array;

    public function destroy(int $id): void;
}