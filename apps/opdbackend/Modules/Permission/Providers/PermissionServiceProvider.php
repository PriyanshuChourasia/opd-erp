<?php

namespace Modules\Permission\Providers;

use Illuminate\Support\ServiceProvider;

class PermissionServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(
            \Modules\Permission\Interfaces\PermissionRepositoryInterface::class,
            \Modules\Permission\Repositories\PermissionRepository::class
        );

        $this->app->bind(
            \Modules\Permission\Contracts\PermissionServiceInterface::class,
            \Modules\Permission\Services\PermissionService::class
        );
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/../Routes/api.php');
        $this->loadRoutesFrom(__DIR__.'/../Routes/web.php');
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'permission');
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
    }
}