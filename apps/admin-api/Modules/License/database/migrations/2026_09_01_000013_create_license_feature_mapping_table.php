<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('license_feature_mapping', function (Blueprint $table) {
            $table->uuid('id')->default(\Illuminate\Support\Facades\DB::raw('(UUID())'))->primary();
            $table->foreignUuid('license_id')->constrained('licenses')->cascadeOnDelete();
            $table->foreignUuid('feature_id')->constrained('license_features')->restrictOnDelete();
            $table->boolean('value')->default(true);
            $table->integer('limit_value')->nullable();
            $table->timestamps();

            $table->unique(['license_id', 'feature_id']);
            $table->index(['feature_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('license_feature_mapping');
    }
};
