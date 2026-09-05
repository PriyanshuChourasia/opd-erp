<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->foreignUuid('organization_id')->nullable()->after('id')->constrained('organizations')->cascadeOnDelete();
        });

        Schema::table('roles', function (Blueprint $table) {
            $table->dropUnique(['name']);
            $table->dropUnique(['slug']);
        });

        Schema::table('roles', function (Blueprint $table) {
            $table->unique(['name', 'organization_id']);
            $table->unique(['slug', 'organization_id']);
        });
    }

    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->dropUnique(['name', 'organization_id']);
            $table->dropUnique(['slug', 'organization_id']);
        });

        Schema::table('roles', function (Blueprint $table) {
            $table->unique('name');
            $table->unique('slug');
        });

        Schema::table('roles', function (Blueprint $table) {
            $table->dropConstrainedForeignId('organization_id');
        });
    }
};
