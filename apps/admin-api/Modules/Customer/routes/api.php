<?php

use Illuminate\Support\Facades\Route;
use Modules\Customer\Controllers\CustomerController;

Route::middleware('auth:jwt')->prefix('customers')->group(function () {
    Route::get('/', [CustomerController::class, 'index']);
    Route::post('/', [CustomerController::class, 'store']);
    Route::get('{customer}', [CustomerController::class, 'show'])->whereNumber('customer');
    Route::put('{customer}', [CustomerController::class, 'update'])->whereNumber('customer');
    Route::delete('{customer}', [CustomerController::class, 'destroy'])->whereNumber('customer');
});