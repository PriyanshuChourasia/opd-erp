<?php

namespace Modules\FinancialYear\Contracts;

use Illuminate\Http\Request;
use Modules\FinancialYear\Http\Requests\StoreFinancialYearRequest;
use Modules\FinancialYear\Http\Requests\UpdateFinancialYearRequest;
use Modules\FinancialYear\Models\FinancialYear;

interface FinancialYearServiceInterface
{
    public function index(Request $request): array;

    public function show(FinancialYear $financialYear): array;

    public function store(StoreFinancialYearRequest $request): array;

    public function update(FinancialYear $financialYear, UpdateFinancialYearRequest $request): array;

    public function destroy(FinancialYear $financialYear): void;

    public function current(): array;

    public function setCurrent(FinancialYear $financialYear): array;

    public function close(FinancialYear $financialYear): array;
}
