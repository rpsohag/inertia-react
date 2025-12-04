<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('servers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->string('name');
            $table->string('ip_address');
            $table->string('port')->default('22');
            $table->string('username');
            $table->string('password')->nullable();
            $table->foreignId('ssh_key_id')->nullable()->references('id')->on('ssh_keys')->onDelete('cascade');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->enum('auth_type', ['password', 'private_key'])->default('password');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('servers');
    }
};
