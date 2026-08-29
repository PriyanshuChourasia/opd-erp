<?php

namespace Modules\Designation\Contracts;

use Illuminate\Http\Request;
use Modules\Designation\Http\Requests\StoreDesignationRequest;
use Modules\Designation\Http\Requests\UpdateDesignationRequest;

interface DesignationServiceInterface
{
    public function index(Request $request): array;

    public function show(int $id): array;

    public function store(StoreDesignationRequest $request): array;

    public function update(int $id, UpdateDesignationRequest $request): array;

    public function destroy(int $id): void;
}