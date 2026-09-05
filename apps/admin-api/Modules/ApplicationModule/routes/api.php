<?php

use Illuminate\Support\Facades\Route;
use Modules\ApplicationModule\Controllers\ApplicationModuleController;

Route::middleware('auth:jwt')->prefix('application-modules')->group(function () {
    Route::get('/', [ApplicationModuleController::class, 'index']);
    Route::post('/', [ApplicationModuleController::class, 'store']);
    Route::get('{applicationModule}', [ApplicationModuleController::class, 'show'])->whereNumber('applicationModule');
    Route::put('{applicationModule}', [ApplicationModuleController::class, 'update'])->whereNumber('applicationModule');
    Route::delete('{applicationModule}', [ApplicationModuleController::class, 'destroy'])->whereNumber('applicationModule');
});