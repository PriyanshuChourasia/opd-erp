<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('licenses', function (Blueprint $table) {
            $table->uuid('id')->default(\Illuminate\Support\Facades\DB::raw('(UUID())'))->primary();
            $table->string('license_number', 40)->unique();
            $table->string('activation_secret_hash', 64)->nullable()->unique();
            $table->foreignUuid('customer_id')->constrained('customers')->restrictOnDelete();
            $table->foreignUuid('organization_id')->constrained('organizations')->restrictOnDelete();
            $table->foreignUuid('plan_id')->constrained('license_plans')->restrictOnDelete();
            $table->string('status')->default('created');
            $table->date('issue_date')->nullable();
            $table->date('start_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->integer('max_users')->default(1);
            $table->integer('max_devices')->default(1);
            $table->text('notes')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->foreignUuid('activated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('revoked_at')->nullable();
            $table->foreignUuid('revoked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('revoke_reason', 255)->nullable();
            $table->timestamps();

            $table->index(['organization_id']);
            $table->index(['customer_id']);
            $table->index(['status']);
            $table->index(['start_date', 'expiry_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('licenses');
    }
};
