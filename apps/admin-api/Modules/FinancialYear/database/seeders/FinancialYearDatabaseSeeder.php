<?php

namespace Modules\FinancialYear\Database\Seeders;

use Illuminate\Database\Seeder;

class FinancialYearDatabaseSeeder extends Seeder
{
    /**
     * Run the financial year module database seeds.
     */
    public function run(): void
    {
        $this->call([
            FinancialYearPermissionSeeder::class,
        ]);
    }
}
