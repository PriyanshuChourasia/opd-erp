<?php

namespace Modules\Role\Providers;

use Illuminate\Support\ServiceProvider;

class RoleServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(
            \Modules\Role\Interfaces\RoleRepositoryInterface::class,
            \Modules\Role\Repositories\RoleRepository::class
        );

        $this->app->bind(
            \Modules\Role\Contracts\RoleServiceInterface::class,
            \Modules\Role\Services\RoleService::class
        );
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/../Routes/api.php');
        $this->loadRoutesFrom(__DIR__.'/../Routes/web.php');
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'role');
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
    }
}