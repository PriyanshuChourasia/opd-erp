<?php

use Illuminate\Support\Facades\Route;
use Modules\Employee\Controllers\EmployeeController;

Route::middleware('auth:jwt')->prefix('employees')->group(function () {
    Route::get('/', [EmployeeController::class, 'index']);
    Route::post('/', [EmployeeController::class, 'store']);
    Route::get('{employee}', [EmployeeController::class, 'show'])->whereNumber('employee');
    Route::put('{employee}', [EmployeeController::class, 'update'])->whereNumber('employee');
    Route::delete('{employee}', [EmployeeController::class, 'destroy'])->whereNumber('employee');
});