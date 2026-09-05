<?php

namespace Modules\Auth\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Auth\Models\Admin;

class AuthDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (Admin::query()->where('email', 'admin@admin.com')->doesntExist()) {
            Admin::query()->create([
                'username' => 'admin',
                'email' => 'admin@admin.com',
                'password' => 'Password@123',
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'is_active' => true,
            ]);
        }
    }
}
