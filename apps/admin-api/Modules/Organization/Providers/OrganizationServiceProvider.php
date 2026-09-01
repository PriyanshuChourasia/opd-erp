<?php

namespace Modules\Organization\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Modules\Organization\Contracts\OrganizationServiceInterface;
use Modules\Organization\Services\OrganizationService;
use Modules\Organization\Services\TenantService;

class OrganizationServiceProvider extends ServiceProvider
{
    protected string $moduleName = 'Organization';

    protected string $moduleNameLower = 'organization';

    public function boot(): void
    {
        $this->registerConfig();
        $this->loadMigrationsFrom(module_path($this->moduleName, 'database/migrations'));
        $this->registerRoutes();
    }

    public function register(): void
    {
        $this->app->singleton(OrganizationServiceInterface::class, OrganizationService::class);
        $this->app->singleton(TenantService::class);
    }

    protected function registerConfig(): void
    {
        $this->publishes([
            module_path($this->moduleName, 'config/config.php') => config_path($this->moduleNameLower.'.php'),
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
