<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
                    $table->id();
        $table->string('first_name', 255);
        $table->string('last_name', 255)->nullable();
        $table->string('email', 255)->unique();
        $table->string('phone', 50)->nullable();
        $table->string('gender', 20)->nullable();
        $table->date('date_of_joining')->nullable();
        $table->string('status')->nullable()->default('active');
        $table->foreignId('department_id')->constrained('departments')->cascadeOnDelete();
        $table->foreignId('designation_id')->constrained('designations')->cascadeOnDelete();
        $table->foreignId('user_id')->nullable()->unique()->constrained('users')->cascadeOnDelete();
        $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};