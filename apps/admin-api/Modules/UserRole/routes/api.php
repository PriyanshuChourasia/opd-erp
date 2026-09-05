<?php

use Illuminate\Support\Facades\Route;
use Modules\UserRole\Controllers\UserRoleController;

Route::middleware('auth:jwt')->prefix('user-roles')->group(function () {
    Route::get('/', [UserRoleController::class, 'index']);
    Route::post('/', [UserRoleController::class, 'store']);
    Route::delete('{userRole}', [UserRoleController::class, 'destroy'])->whereNumber('userRole');
});