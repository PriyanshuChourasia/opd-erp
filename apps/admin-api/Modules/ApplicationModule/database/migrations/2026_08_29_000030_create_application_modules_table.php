<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('application_modules', function (Blueprint $table) {
                    $table->uuid('id')->default(\Illuminate\Support\Facades\DB::raw('(UUID())'))->primary();
        $table->string('name', 150)->unique();
        $table->string('slug', 150)->unique();
        $table->string('icon', 100)->nullable();
        $table->text('description')->nullable();
        $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('application_modules');
    }
};