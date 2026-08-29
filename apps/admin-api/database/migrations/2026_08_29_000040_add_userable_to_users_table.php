<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('userable_type')->nullable()->after('remember_token');
            $table->unsignedBigInteger('userable_id')->nullable()->after('userable_type');

            $table->index(['userable_type', 'userable_id']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['userable_type', 'userable_id']);
            $table->dropColumn(['userable_type', 'userable_id']);
        });
    }
};