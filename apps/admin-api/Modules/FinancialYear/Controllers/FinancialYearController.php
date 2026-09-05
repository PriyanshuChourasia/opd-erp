<?php

namespace Modules\FinancialYear\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\FinancialYear\Contracts\FinancialYearServiceInterface;
use Modules\FinancialYear\Http\Requests\StoreFinancialYearRequest;
use Modules\FinancialYear\Http\Requests\UpdateFinancialYearRequest;
use Modules\FinancialYear\Models\FinancialYear;

class FinancialYearController
{
    public function __construct(private readonly FinancialYearServiceInterface $service) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->service->index($request));
    }

    public function store(StoreFinancialYearRequest $request): JsonResponse
    {
        return response()->json($this->service->store($request), 201);
    }

    public function show(FinancialYear $financialYear): JsonResponse
    {
        return response()->json($this->service->show($financialYear));
    }

    public function update(FinancialYear $financialYear, UpdateFinancialYearRequest $request): JsonResponse
    {
        return response()->json($this->service->update($financialYear, $request));
    }

    public function destroy(FinancialYear $financialYear): JsonResponse
    {
        $this->service->destroy($financialYear);

        return response()->json(null, 204);
    }

    public function current(): JsonResponse
    {
        return response()->json($this->service->current());
    }

    public function setCurrent(FinancialYear $financialYear): JsonResponse
    {
        return response()->json($this->service->setCurrent($financialYear));
    }

    public function close(FinancialYear $financialYear): JsonResponse
    {
        return response()->json($this->service->close($financialYear));
    }
}
