<?php

namespace Modules\Designation\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Modules\Designation\Contracts\DesignationServiceInterface;
use Modules\Designation\Services\DesignationService;

class DesignationServiceProvider extends ServiceProvider
{
    protected string $moduleName = 'Designation';

    protected string $moduleNameLower = 'designation';

    public function boot(): void
    {
        $this->registerConfig();
        $this->loadMigrationsFrom(module_path($this->moduleName, 'database/migrations'));
        $this->registerRoutes();
    }

    public function register(): void
    {
        $this->app->singleton(DesignationServiceInterface::class, DesignationService::class);
    }

    protected function registerConfig(): void
    {
        $this->publishes([
            module_path($this->moduleName, 'config/config.php') => config_path($this->moduleNameLower . '.php'),
        ], 'config');

        $this->mergeConfigFrom(
            module_path($this->moduleName, 'config/config.php'),
            $this->moduleNameLower
        );
    }

    protected function registerRoutes(): void
    {
        Route::middleware('api')
            ->prefix('api')
            ->group(module_path($this->moduleName, 'routes/api.php'));
    }
}