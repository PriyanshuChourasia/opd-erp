<?php

namespace App\Providers;

use App\Console\Commands\ModuleMakeCustomCommand;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    protected $commands = [
        ModuleMakeCustomCommand::class,
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->commands($this->commands);
    }
}
