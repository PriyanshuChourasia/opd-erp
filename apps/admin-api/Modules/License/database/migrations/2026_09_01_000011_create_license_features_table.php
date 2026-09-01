<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('license_features', function (Blueprint $table) {
            $table->uuid('id')->default(\Illuminate\Support\Facades\DB::raw('(UUID())'))->primary();
            $table->string('code', 60)->unique();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->foreignUuid('module_id')->nullable()->constrained('application_modules')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['module_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('license_features');
    }
};
