<?php

namespace Modules\ApplicationFeature\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Modules\ApplicationFeature\Contracts\ApplicationFeatureServiceInterface;
use Modules\ApplicationFeature\Services\ApplicationFeatureService;

class ApplicationFeatureServiceProvider extends ServiceProvider
{
    protected string $moduleName = 'ApplicationFeature';

    protected string $moduleNameLower = 'applicationfeature';

    public function boot(): void
    {
        $this->registerConfig();
        $this->loadMigrationsFrom(module_path($this->moduleName, 'database/migrations'));
        $this->registerRoutes();
    }

    public function register(): void
    {
        $this->app->singleton(ApplicationFeatureServiceInterface::class, ApplicationFeatureService::class);
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