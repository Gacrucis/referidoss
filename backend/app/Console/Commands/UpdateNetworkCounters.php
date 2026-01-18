<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class UpdateNetworkCounters extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'network:update-counters';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Actualizar contadores de red (direct_referrals_count y total_network_count) para todos los usuarios';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Actualizando contadores de red...');

        $users = User::whereNotNull('path')->get();
        $bar = $this->output->createProgressBar($users->count());

        foreach ($users as $user) {
            // Contar referidos directos
            $directCount = User::where('referrer_id', $user->id)
                ->whereNull('deleted_at')
                ->count();

            // Contar red total usando ltree
            $totalCount = User::whereRaw('path <@ ?', [$user->path])
                ->where('id', '!=', $user->id)
                ->whereNull('deleted_at')
                ->count();

            $user->direct_referrals_count = $directCount;
            $user->total_network_count = $totalCount;
            $user->save();

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('✓ Contadores actualizados exitosamente!');

        // Mostrar resumen
        $this->newLine();
        $this->info('Resumen:');
        $this->table(
            ['Rol', 'Usuarios', 'Promedio Red'],
            [
                [
                    'Super Admin',
                    User::where('role', 'super_admin')->count(),
                    round(User::where('role', 'super_admin')->avg('total_network_count'), 2)
                ],
                [
                    'Líderes',
                    User::where('role', 'leader')->count(),
                    round(User::where('role', 'leader')->avg('total_network_count'), 2)
                ],
                [
                    'Miembros',
                    User::where('role', 'member')->count(),
                    round(User::where('role', 'member')->avg('total_network_count'), 2)
                ],
            ]
        );

        return Command::SUCCESS;
    }
}
