<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
                    $table->id();
        $table->string('first_name', 255);
        $table->string('last_name', 255)->nullable();
        $table->string('email', 255)->unique();
        $table->string('phone', 50)->nullable();
        $table->string('gender', 20)->nullable();
        $table->date('date_of_birth')->nullable();
        $table->string('address', 255)->nullable();
        $table->string('city', 100)->nullable();
        $table->string('state', 100)->nullable();
        $table->string('country', 100)->nullable();
        $table->string('pincode', 20)->nullable();
        $table->string('status')->nullable()->default('active');
        $table->foreignId('user_id')->nullable()->unique()->constrained('users')->cascadeOnDelete();
        $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};