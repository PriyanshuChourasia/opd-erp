<?php

use Illuminate\Support\Facades\Route;
use Modules\ApplicationFeature\Controllers\ApplicationFeatureController;

Route::middleware('auth:jwt')->prefix('application-features')->group(function () {
    Route::get('/', [ApplicationFeatureController::class, 'index']);
    Route::post('/', [ApplicationFeatureController::class, 'store']);
    Route::get('{applicationFeature}', [ApplicationFeatureController::class, 'show'])->whereNumber('applicationFeature');
    Route::put('{applicationFeature}', [ApplicationFeatureController::class, 'update'])->whereNumber('applicationFeature');
    Route::delete('{applicationFeature}', [ApplicationFeatureController::class, 'destroy'])->whereNumber('applicationFeature');
});