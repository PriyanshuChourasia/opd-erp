<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('application_features', function (Blueprint $table) {
                    $table->id();
        $table->string('name', 150);
        $table->string('slug', 150);
        $table->text('description')->nullable();
        $table->foreignId('module_id')->constrained('application_modules')->cascadeOnDelete();
        $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('application_features');
    }
};