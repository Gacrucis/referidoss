<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Habilitar extensión ltree
        DB::statement('CREATE EXTENSION IF NOT EXISTS ltree');

        Schema::create('users', function (Blueprint $table) {
            // ID y autenticación
            $table->id();
            $table->string('email')->unique()->nullable(); // Nullable para miembros/referidos
            $table->string('password')->nullable(); // Nullable para miembros/referidos
            $table->enum('role', ['super_admin', 'leader', 'member'])->default('member');

            // Datos personales del referido (TODOS OBLIGATORIOS)
            $table->string('cedula')->unique();
            $table->string('nombre_completo');
            $table->string('celular');
            $table->string('barrio');

            // Datos de votación
            $table->string('departamento_votacion');
            $table->string('municipio_votacion');
            $table->string('puesto_votacion');
            $table->string('direccion_votacion');
            $table->string('mesa_votacion');
            $table->text('observaciones')->nullable();

            // Sistema de referidos
            $table->foreignId('referrer_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('referral_code', 8)->unique(); // Código único de 8 caracteres

            // Campos para ltree (path jerárquico)
            $table->string('path')->nullable(); // Se convertirá a ltree en PostgreSQL
            $table->integer('level')->default(0); // Profundidad en el árbol

            // Estadísticas cacheadas (para performance)
            $table->integer('direct_referrals_count')->default(0);
            $table->integer('total_network_count')->default(0);

            // Control
            $table->boolean('is_active')->default(true);
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes(); // Soft deletes

            // Índices para optimización
            $table->index(['referrer_id', 'is_active'], 'idx_referrer_active');
            $table->index(['level', 'created_at'], 'idx_level_created');
            $table->index('cedula', 'idx_cedula');
            $table->index('departamento_votacion', 'idx_departamento');
        });

        // Convertir columna 'path' a tipo ltree usando SQL raw
        DB::statement('ALTER TABLE users ALTER COLUMN path TYPE ltree USING path::ltree');

        // Crear índice GIST para ltree (optimiza búsquedas de ancestros/descendientes)
        DB::statement('CREATE INDEX idx_path_gist ON users USING GIST (path)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        // No eliminamos la extensión ltree por si otras tablas la usan
    }
};
