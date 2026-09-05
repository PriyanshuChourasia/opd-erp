<?php

namespace Modules\License\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Modules\License\Contracts\LicenseServiceInterface;
use Modules\License\Services\LicenseService;
use Modules\License\Services\LicenseValidationService;

class LicenseServiceProvider extends ServiceProvider
{
    protected string $moduleName = 'License';

    protected string $moduleNameLower = 'license';

    public function boot(): void
    {
        $this->registerConfig();
        $this->loadMigrationsFrom(module_path($this->moduleName, 'database/migrations'));
        $this->registerRoutes();
    }

    public function register(): void
    {
        $this->app->singleton(LicenseServiceInterface::class, LicenseService::class);

        // Licensed grace window + auth guard are explicit constructor args that
        // the container cannot auto-resolve, so bind it explicitly.
        $this->app->singleton(LicenseValidationService::class, function ($app): LicenseValidationService {
            return new LicenseValidationService(
                (int) config('license.grace_period_days', 7),
                $app['auth'],
            );
        });
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
