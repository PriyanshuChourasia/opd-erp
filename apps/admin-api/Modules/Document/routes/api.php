<?php

use Illuminate\Support\Facades\Route;
use Modules\Document\Controllers\DocumentController;

Route::middleware('auth:jwt')->prefix('documents')->group(function () {
    Route::get('/', [DocumentController::class, 'index']);
    Route::post('/', [DocumentController::class, 'store']);
    Route::get('{document}', [DocumentController::class, 'show'])->whereNumber('document');
    Route::put('{document}', [DocumentController::class, 'update'])->whereNumber('document');
    Route::delete('{document}', [DocumentController::class, 'destroy'])->whereNumber('document');
});