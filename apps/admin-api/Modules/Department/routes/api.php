<?php

use Illuminate\Support\Facades\Route;
use Modules\Department\Controllers\DepartmentController;

Route::middleware('auth:jwt')->prefix('departments')->group(function () {
    Route::get('/', [DepartmentController::class, 'index']);
    Route::post('/', [DepartmentController::class, 'store']);
    Route::get('{department}', [DepartmentController::class, 'show'])->whereNumber('department');
    Route::put('{department}', [DepartmentController::class, 'update'])->whereNumber('department');
    Route::delete('{department}', [DepartmentController::class, 'destroy'])->whereNumber('department');
});