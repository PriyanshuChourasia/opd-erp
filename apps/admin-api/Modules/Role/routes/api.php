<?php

use Illuminate\Support\Facades\Route;
use Modules\Role\Controllers\RoleController;

Route::middleware('auth:jwt')->prefix('roles')->group(function () {
    Route::get('/', [RoleController::class, 'index']);
    Route::post('/', [RoleController::class, 'store']);
    Route::get('{role}', [RoleController::class, 'show'])->whereNumber('role');
    Route::put('{role}', [RoleController::class, 'update'])->whereNumber('role');
    Route::delete('{role}', [RoleController::class, 'destroy'])->whereNumber('role');
});