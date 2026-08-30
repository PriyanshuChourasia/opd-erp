<?php

namespace Modules\Country\Contracts;

use Illuminate\Http\Request;
use Modules\Country\Http\Requests\StoreCountryRequest;
use Modules\Country\Http\Requests\UpdateCountryRequest;

interface CountryServiceInterface
{
    public function index(Request $request): array;

    public function show(int $id): array;

    public function store(StoreCountryRequest $request): array;

    public function update(int $id, UpdateCountryRequest $request): array;

    public function destroy(int $id): void;
}