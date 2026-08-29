<?php

use Illuminate\Support\Facades\Route;
use Modules\Permission\Controllers\PermissionController;

Route::middleware('auth:jwt')->prefix('permissions')->group(function () {
    Route::get('/', [PermissionController::class, 'index']);
    Route::post('/', [PermissionController::class, 'store']);
    Route::get('{permission}', [PermissionController::class, 'show'])->whereNumber('permission');
    Route::put('{permission}', [PermissionController::class, 'update'])->whereNumber('permission');
    Route::delete('{permission}', [PermissionController::class, 'destroy'])->whereNumber('permission');
});