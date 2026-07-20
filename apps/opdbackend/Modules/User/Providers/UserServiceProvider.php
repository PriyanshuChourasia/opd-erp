<?php

namespace Modules\User\Providers;

use Illuminate\Support\ServiceProvider;

class UserServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(
            \Modules\User\Interfaces\UserRepositoryInterface::class,
            \Modules\User\Repositories\UserRepository::class
        );

        $this->app->bind(
            \Modules\User\Contracts\UserServiceInterface::class,
            \Modules\User\Services\UserService::class
        );
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/../Routes/api.php');
        $this->loadRoutesFrom(__DIR__.'/../Routes/web.php');
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'user');
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
    }
}