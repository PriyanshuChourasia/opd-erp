<?php

namespace Modules\Customer\Contracts;

use Illuminate\Http\Request;
use Modules\Customer\Http\Requests\StoreCustomerRequest;
use Modules\Customer\Http\Requests\UpdateCustomerRequest;

interface CustomerServiceInterface
{
    public function index(Request $request): array;

    public function show(int $id): array;

    public function store(StoreCustomerRequest $request): array;

    public function update(int $id, UpdateCustomerRequest $request): array;

    public function destroy(int $id): void;
}