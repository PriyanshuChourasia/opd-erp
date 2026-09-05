<?php

namespace Modules\FinancialYear\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\FinancialYear\Permissions\FinancialYearPermission;
use Modules\Permission\Models\Permission;

class FinancialYearPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $definitions = [
            [FinancialYearPermission::READ, 'Financial Year Read', 'View financial years within the organization.'],
            [FinancialYearPermission::CREATE, 'Financial Year Create', 'Create a new financial year.'],
            [FinancialYearPermission::UPDATE, 'Financial Year Update', 'Update an open financial year.'],
            [FinancialYearPermission::SET_CURRENT, 'Financial Year Set Current', 'Designate a financial year as the current one.'],
            [FinancialYearPermission::CLOSE, 'Financial Year Close', 'Close a financial year.'],
            [FinancialYearPermission::DELETE, 'Financial Year Delete', 'Delete an unused open financial year.'],
        ];

        foreach ($definitions as [$slug, $name, $description]) {
            Permission::query()->firstOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'module' => 'financial_year', 'description' => $description]
            );
        }
    }
}
