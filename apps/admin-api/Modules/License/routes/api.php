<?php

use Illuminate\Support\Facades\Route;
use Modules\License\Controllers\LicenseController;

Route::middleware('auth:jwt')->prefix('licenses')->group(function () {
    Route::get('/', [LicenseController::class, 'index']);
    Route::post('/', [LicenseController::class, 'store']);
    Route::get('{license}', [LicenseController::class, 'show'])->whereNumber('license');
    Route::put('{license}', [LicenseController::class, 'update'])->whereNumber('license');
    Route::delete('{license}', [LicenseController::class, 'destroy'])->whereNumber('license');
});
