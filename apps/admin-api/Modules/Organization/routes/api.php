<?php

use Illuminate\Support\Facades\Route;
use Modules\Organization\Controllers\OrganizationController;

Route::middleware('auth:jwt')->prefix('organizations')->group(function () {
    Route::get('/', [OrganizationController::class, 'index']);
    Route::post('/', [OrganizationController::class, 'store']);
    Route::get('{organization}', [OrganizationController::class, 'show'])->whereNumber('organization');
    Route::put('{organization}', [OrganizationController::class, 'update'])->whereNumber('organization');
    Route::delete('{organization}', [OrganizationController::class, 'destroy'])->whereNumber('organization');
});
