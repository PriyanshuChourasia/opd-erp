<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('company_name', 255)->nullable()->after('last_name');
            $table->string('tax_number', 100)->nullable()->after('company_name');
            $table->string('billing_address', 255)->nullable()->after('pincode');
            $table->string('billing_city', 100)->nullable()->after('billing_address');
            $table->string('billing_state', 100)->nullable()->after('billing_city');
            $table->string('billing_country', 100)->nullable()->after('billing_state');
            $table->string('billing_pincode', 20)->nullable()->after('billing_country');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn([
                'company_name',
                'tax_number',
                'billing_address',
                'billing_city',
                'billing_state',
                'billing_country',
                'billing_pincode',
            ]);
        });
    }
};
