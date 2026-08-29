<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('username')->unique();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('gender')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('email')->unique();
            $table->string('mobile_number')->nullable();
            $table->string('country_code')->default('+91');
            $table->string('profile_photo_url')->nullable();
            $table->string('qualification')->nullable();
            $table->string('password');
            $table->boolean('is_active')->default(true);
            $table->uuid('role_id');
            $table->string('userable_type')->nullable();
            $table->string('userable_id')->nullable();
            $table->string('remember_token')->nullable();
            $table->timestamps();

            $table->index(['userable_type', 'userable_id']);
            $table->foreign('role_id')->references('id')->on('roles');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
