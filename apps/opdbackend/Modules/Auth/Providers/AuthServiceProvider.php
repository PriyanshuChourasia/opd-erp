<?php

namespace Modules\Auth\Providers;

use Illuminate\Support\ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(
            \Modules\Auth\Interfaces\AuthRepositoryInterface::class,
            \Modules\Auth\Repositories\AuthRepository::class
        );

        $this->app->bind(
            \Modules\Auth\Contracts\AuthServiceInterface::class,
            \Modules\Auth\Services\AuthService::class
        );
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/../Routes/api.php');
        $this->loadRoutesFrom(__DIR__.'/../Routes/web.php');
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'auth');
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
    }
}