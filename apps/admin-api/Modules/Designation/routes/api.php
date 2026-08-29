<?php

use Illuminate\Support\Facades\Route;
use Modules\Designation\Controllers\DesignationController;

Route::middleware('auth:jwt')->prefix('designations')->group(function () {
    Route::get('/', [DesignationController::class, 'index']);
    Route::post('/', [DesignationController::class, 'store']);
    Route::get('{designation}', [DesignationController::class, 'show'])->whereNumber('designation');
    Route::put('{designation}', [DesignationController::class, 'update'])->whereNumber('designation');
    Route::delete('{designation}', [DesignationController::class, 'destroy'])->whereNumber('designation');
});