<?php

use Illuminate\Support\Facades\Route;
use Modules\FinancialYear\Controllers\FinancialYearController;
use Modules\FinancialYear\Permissions\FinancialYearPermission;

Route::middleware('auth:jwt')->prefix('financial-years')->group(function () {
    Route::get('/current', [FinancialYearController::class, 'current'])
        ->middleware('permission:'.FinancialYearPermission::READ);
    Route::get('/', [FinancialYearController::class, 'index'])
        ->middleware('permission:'.FinancialYearPermission::READ);
    Route::post('/', [FinancialYearController::class, 'store'])
        ->middleware('permission:'.FinancialYearPermission::CREATE);
    Route::get('{financialYear}', [FinancialYearController::class, 'show'])
        ->middleware('permission:'.FinancialYearPermission::READ);
    Route::put('{financialYear}', [FinancialYearController::class, 'update'])
        ->middleware('permission:'.FinancialYearPermission::UPDATE);
    Route::patch('{financialYear}/current', [FinancialYearController::class, 'setCurrent'])
        ->middleware('permission:'.FinancialYearPermission::SET_CURRENT);
    Route::post('{financialYear}/close', [FinancialYearController::class, 'close'])
        ->middleware('permission:'.FinancialYearPermission::CLOSE);
    Route::delete('{financialYear}', [FinancialYearController::class, 'destroy'])
        ->middleware('permission:'.FinancialYearPermission::DELETE);
});
