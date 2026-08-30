<?php

use Illuminate\Support\Facades\Route;
use Modules\State\Controllers\StateController;

Route::middleware('auth:jwt')->prefix('states')->group(function () {
    Route::get('/', [StateController::class, 'index']);
    Route::post('/', [StateController::class, 'store']);
    Route::get('{state}', [StateController::class, 'show'])->whereNumber('state');
    Route::put('{state}', [StateController::class, 'update'])->whereNumber('state');
    Route::delete('{state}', [StateController::class, 'destroy'])->whereNumber('state');
});