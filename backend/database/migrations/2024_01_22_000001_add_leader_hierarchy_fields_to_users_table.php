<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Agrega campos para el sistema de jerarquía de líderes:
     * - leader_type: tipo de líder (papa, hijo, lnpro)
     * - leader_referral_code: código para referir sub-líderes
     * - leader_parent_id: referencia al líder superior en la jerarquía
     * - direct_subleaders_count: conteo de sub-líderes directos
     * - total_subleaders_count: conteo total de sub-líderes en la red
     * - total_network_members_count: conteo de miembros (nietos) en toda la red
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Tipo de líder en la jerarquía
            $table->enum('leader_type', ['papa', 'hijo', 'lnpro'])->nullable()->after('role');

            // Código único para referir sub-líderes (diferente al referral_code para nietos)
            $table->string('leader_referral_code', 10)->nullable()->unique()->after('referral_code');

            // Referencia al líder superior en la jerarquía (diferente a referrer_id que es para la red de nietos)
            $table->foreignId('leader_parent_id')->nullable()->after('referrer_id')
                  ->constrained('users')->nullOnDelete();

            // Contadores de sub-líderes
            $table->integer('direct_subleaders_count')->default(0)->after('direct_referrals_count');
            $table->integer('total_subleaders_count')->default(0)->after('direct_subleaders_count');

            // Conteo acumulado de miembros (nietos) de toda la red jerárquica
            $table->integer('total_network_members_count')->default(0)->after('total_network_count');

            // Path jerárquico de líderes (separado del path de referidos)
            $table->string('leader_path')->nullable()->after('path');

            // Índices para búsquedas
            $table->index('leader_type');
            $table->index('leader_parent_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['leader_parent_id']);
            $table->dropIndex(['leader_type']);
            $table->dropIndex(['leader_parent_id']);

            $table->dropColumn([
                'leader_type',
                'leader_referral_code',
                'leader_parent_id',
                'direct_subleaders_count',
                'total_subleaders_count',
                'total_network_members_count',
                'leader_path',
            ]);
        });
    }
};
