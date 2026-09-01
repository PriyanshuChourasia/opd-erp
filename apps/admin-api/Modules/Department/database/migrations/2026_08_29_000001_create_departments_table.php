<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
                    $table->uuid('id')->default(\Illuminate\Support\Facades\DB::raw('(UUID())'))->primary();
        $table->string('name', 255);
        $table->string('code', 50)->nullable()->unique();
        $table->text('description')->nullable();
        $table->string('status')->nullable()->default('active');
        $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('departments');
    }
};