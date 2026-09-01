<?php

namespace App\Providers;

use App\Models\User;
use App\Services\AuthorizationService;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(AuthorizationService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Relation::morphMap([
            'employee' => \Modules\Employee\Models\Employee::class,
            'customer' => \Modules\Customer\Models\Customer::class,
        ]);

        /*
         * Authorization foundation: every permission slug used by the
         * application is answered by the AuthorizationService (roles + direct
         * user permissions). Enables `$user->can('organization.read')`,
         * `Gate::allows(...)` and `Gate::authorize(...)`.
         */
        Gate::before(function (User $user, string $ability): ?bool {
            return app(AuthorizationService::class)->can($user, $ability) ? true : null;
        });
    }
}
