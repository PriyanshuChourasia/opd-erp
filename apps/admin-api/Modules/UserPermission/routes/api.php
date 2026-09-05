<?php

use Illuminate\Support\Facades\Route;
use Modules\UserPermission\Controllers\UserPermissionController;

Route::middleware('auth:jwt')->prefix('user-permissions')->group(function () {
    Route::get('/', [UserPermissionController::class, 'index']);
    Route::post('/', [UserPermissionController::class, 'store']);
    Route::delete('{userPermission}', [UserPermissionController::class, 'destroy'])->whereNumber('userPermission');
});