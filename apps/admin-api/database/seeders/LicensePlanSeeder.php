<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\License\Models\LicensePlan;

class LicensePlanSeeder extends Seeder
{
    /**
     * System-level catalog of license plans (platform data, not tenant data).
     */
    public function run(): void
    {
        $plans = [
            ['code' => 'BASIC', 'name' => 'Basic', 'description' => 'Entry-level plan for single-branch practices.', 'price' => 499.00, 'currency' => 'USD', 'is_active' => true, 'sort_order' => 1],
            ['code' => 'PRO', 'name' => 'Professional', 'description' => 'Full clinical workflow for growing practices.', 'price' => 999.00, 'currency' => 'USD', 'is_active' => true, 'sort_order' => 2],
            ['code' => 'ENTERPRISE', 'name' => 'Enterprise', 'description' => 'Multi-branch and multi-user enterprise deployment.', 'price' => 2499.00, 'currency' => 'USD', 'is_active' => true, 'sort_order' => 3],
        ];

        foreach ($plans as $plan) {
            LicensePlan::query()->updateOrCreate(
                ['code' => $plan['code']],
                $plan
            );
        }
    }
}