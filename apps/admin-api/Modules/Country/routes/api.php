<?php

use Illuminate\Support\Facades\Route;
use Modules\Country\Controllers\CountryController;

Route::middleware('auth:jwt')->prefix('countries')->group(function () {
    Route::get('/', [CountryController::class, 'index']);
    Route::post('/', [CountryController::class, 'store']);
    Route::get('{country}', [CountryController::class, 'show'])->whereNumber('country');
    Route::put('{country}', [CountryController::class, 'update'])->whereNumber('country');
    Route::delete('{country}', [CountryController::class, 'destroy'])->whereNumber('country');
});