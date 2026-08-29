<?php

namespace Modules\Department\Contracts;

use Illuminate\Http\Request;
use Modules\Department\Http\Requests\StoreDepartmentRequest;
use Modules\Department\Http\Requests\UpdateDepartmentRequest;

interface DepartmentServiceInterface
{
    public function index(Request $request): array;

    public function show(int $id): array;

    public function store(StoreDepartmentRequest $request): array;

    public function update(int $id, UpdateDepartmentRequest $request): array;

    public function destroy(int $id): void;
}