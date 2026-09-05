<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('license_renewals', function (Blueprint $table) {
            $table->uuid('id')->default(\Illuminate\Support\Facades\DB::raw('(UUID())'))->primary();
            $table->foreignUuid('license_id')->constrained('licenses')->restrictOnDelete();
            $table->date('previous_expiry_date')->nullable();
            $table->date('new_expiry_date')->nullable();
            $table->foreignUuid('previous_plan_id')->nullable()->constrained('license_plans')->nullOnDelete();
            $table->foreignUuid('new_plan_id')->nullable()->constrained('license_plans')->nullOnDelete();
            $table->string('type')->default('renewal');
            $table->decimal('amount', 14, 2)->nullable();
            $table->string('currency', 10)->default('USD');
            $table->string('transaction_reference', 120)->nullable();
            $table->foreignUuid('renewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('renewed_at')->useCurrent();
            $table->string('notes', 500)->nullable();

            $table->index(['license_id', 'renewed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('license_renewals');
    }
};
