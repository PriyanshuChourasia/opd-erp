<?php

namespace Modules\State\Contracts;

use Illuminate\Http\Request;
use Modules\State\Http\Requests\StoreStateRequest;
use Modules\State\Http\Requests\UpdateStateRequest;

interface StateServiceInterface
{
    public function index(Request $request): array;

    public function show(int $id): array;

    public function store(StoreStateRequest $request): array;

    public function update(int $id, UpdateStateRequest $request): array;

    public function destroy(int $id): void;
}