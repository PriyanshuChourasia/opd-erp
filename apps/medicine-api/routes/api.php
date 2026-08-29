<?php

use App\Http\Controllers\MedicineController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::apiResource('medicines', MedicineController::class);
});
