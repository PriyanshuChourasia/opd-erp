<?php

namespace Modules\Permission\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api')
                ->namespace('Modules\\Permission\\Controllers\\Api')
                ->group(__DIR__.'/../Routes/api.php');
        });
    }
}
