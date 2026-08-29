<?php

namespace Modules\Employee\Contracts;

use Illuminate\Http\Request;
use Modules\Employee\Http\Requests\StoreEmployeeRequest;
use Modules\Employee\Http\Requests\UpdateEmployeeRequest;

interface EmployeeServiceInterface
{
    public function index(Request $request): array;

    public function show(int $id): array;

    public function store(StoreEmployeeRequest $request): array;

    public function update(int $id, UpdateEmployeeRequest $request): array;

    public function destroy(int $id): void;
}