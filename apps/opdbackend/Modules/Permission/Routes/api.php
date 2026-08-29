<?php

use Illuminate\Support\Facades\Route;
use Modules\Permission\Controllers\Api\PermissionController;

Route::middleware('auth:sanctum')->prefix('permissions')->group(function () {
    Route::get('/', [PermissionController::class, 'index']);
    Route::post('/', [PermissionController::class, 'store']);
    Route::get('/{id}', [PermissionController::class, 'show']);
    Route::patch('/{id}', [PermissionController::class, 'update']);
    Route::delete('/{id}', [PermissionController::class, 'destroy']);
});
