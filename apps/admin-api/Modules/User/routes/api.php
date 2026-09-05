<?php

use Illuminate\Support\Facades\Route;
use Modules\User\Controllers\UserController;

Route::middleware('auth:jwt')->prefix('users')->group(function () {
    Route::get('/', [UserController::class, 'index']);
    Route::post('/', [UserController::class, 'store']);
    Route::get('{user}', [UserController::class, 'show'])->whereNumber('user');
    Route::put('{user}', [UserController::class, 'update'])->whereNumber('user');
    Route::delete('{user}', [UserController::class, 'destroy'])->whereNumber('user');
});