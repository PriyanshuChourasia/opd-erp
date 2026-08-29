<?php

use Illuminate\Support\Facades\Route;
use Modules\User\Controllers\Api\UserController;

Route::middleware('auth:sanctum')->prefix('users')->group(function () {
    Route::get('/', [UserController::class, 'index']);
    Route::get('/roles', [UserController::class, 'roles']);
    Route::post('/', [UserController::class, 'store']);
    Route::get('/{id}', [UserController::class, 'show']);
    Route::patch('/{id}', [UserController::class, 'update']);
    Route::delete('/{id}', [UserController::class, 'destroy']);
    Route::patch('/{id}/restore', [UserController::class, 'restore']);
});
