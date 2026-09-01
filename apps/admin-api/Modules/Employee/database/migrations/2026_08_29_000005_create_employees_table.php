<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
                    $table->uuid('id')->default(\Illuminate\Support\Facades\DB::raw('(UUID())'))->primary();
        $table->string('first_name', 255);
        $table->string('last_name', 255)->nullable();
        $table->string('email', 255)->unique();
        $table->string('phone', 50)->nullable();
        $table->string('gender', 20)->nullable();
        $table->date('date_of_joining')->nullable();
        $table->string('status')->nullable()->default('active');
        $table->foreignUuid('department_id')->constrained('departments');
        $table->foreignUuid('designation_id')->constrained('designations');
        $table->foreignUuid('user_id')->nullable()->unique()->constrained('users')->cascadeOnDelete();
        $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};