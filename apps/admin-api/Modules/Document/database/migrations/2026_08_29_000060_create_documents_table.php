<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('original_name')->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->string('path');
            $table->string('storage_disk')->default('local');
            $table->text('description')->nullable();
            $table->nullableMorphs('documentable');
            $table->unsignedBigInteger('uploaded_by')->nullable();
            $table->foreign('uploaded_by')->references('id')->on('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};