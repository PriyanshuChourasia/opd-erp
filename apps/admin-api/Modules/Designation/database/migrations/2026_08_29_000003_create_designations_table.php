<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('designations', function (Blueprint $table) {
                    $table->id();
        $table->string('name', 255);
        $table->text('description')->nullable();
        $table->string('status')->nullable()->default('active');
        $table->foreignId('department_id')->constrained('departments')->cascadeOnDelete();
        $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('designations');
    }
};