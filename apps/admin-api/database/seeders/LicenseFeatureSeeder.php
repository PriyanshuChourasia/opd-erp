<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\License\Models\LicenseFeature;

class LicenseFeatureSeeder extends Seeder
{
    /**
     * System-level catalog of license features (platform data, not tenant data).
     */
    public function run(): void
    {
        $features = [
            ['code' => 'ACCOUNTING', 'name' => 'Accounting', 'description' => 'Voucher-based accounting module.'],
            ['code' => 'INVENTORY', 'name' => 'Inventory', 'description' => 'Stock, warehouses and inventory items.'],
            ['code' => 'SERVICES', 'name' => 'Services', 'description' => 'Service catalogue and billing.'],
            ['code' => 'MOBILE_APP', 'name' => 'Mobile App', 'description' => 'Flutter mobile application access.'],
            ['code' => 'MULTI_BRANCH', 'name' => 'Multi Branch', 'description' => 'Multiple branch organizations/branches.'],
            ['code' => 'ADVANCED_REPORTS', 'name' => 'Advanced Reports', 'description' => 'Advanced and custom reporting.'],
        ];

        foreach ($features as $feature) {
            LicenseFeature::query()->updateOrCreate(
                ['code' => $feature['code']],
                $feature
            );
        }
    }
}