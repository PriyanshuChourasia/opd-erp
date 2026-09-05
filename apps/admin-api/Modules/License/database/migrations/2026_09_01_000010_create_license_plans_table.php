<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('license_plans', function (Blueprint $table) {
            $table->uuid('id')->default(\Illuminate\Support\Facades\DB::raw('(UUID())'))->primary();
            $table->string('code', 40)->unique();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->decimal('price', 14, 2)->nullable();
            $table->string('currency', 10)->default('USD');
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('license_plans');
    }
};
