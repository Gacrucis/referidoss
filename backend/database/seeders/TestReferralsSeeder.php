<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class TestReferralsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Crea 100 referidos de prueba para cada líder existente
     */
    public function run(): void
    {
        $faker = Faker::create('es_CO');

        // Obtener todos los líderes
        $leaders = User::where('role', 'leader')->get();

        if ($leaders->isEmpty()) {
            $this->command->warn('No hay líderes en la base de datos. Ejecuta DatabaseSeeder primero.');
            return;
        }

        $this->command->info("Creando 100 referidos para cada uno de los {$leaders->count()} líderes...");

        $departamentos = [
            '05' => ['Medellín', 'Envigado', 'Bello', 'Itagüí', 'Sabaneta'],
            '11' => ['Bogotá'],
            '76' => ['Cali', 'Palmira', 'Buenaventura', 'Jamundí', 'Tuluá'],
            '08' => ['Barranquilla', 'Soledad', 'Malambo', 'Puerto Colombia'],
            '13' => ['Cartagena', 'Magangué', 'Turbaco', 'Arjona'],
            '68' => ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta'],
            '54' => ['Cúcuta', 'Ocaña', 'Villa del Rosario', 'Los Patios'],
            '17' => ['Manizales', 'Villamaría', 'Chinchiná', 'Riosucio'],
            '19' => ['Popayán', 'Santander de Quilichao', 'Puerto Tejada'],
            '73' => ['Ibagué', 'Espinal', 'Melgar', 'Honda'],
        ];

        $barrios = [
            'Centro', 'Norte', 'Sur', 'Oriente', 'Occidente',
            'La Floresta', 'El Poblado', 'Laureles', 'Belén',
            'San Antonio', 'La Candelaria', 'Boston', 'Chipichape'
        ];

        $puestosVotacion = [
            'Colegio San José', 'Colegio Santa María', 'Escuela República de Colombia',
            'Instituto Técnico Industrial', 'Colegio Nacional', 'Universidad del Valle',
            'Polideportivo Municipal', 'Centro Cívico', 'Institución Educativa Central',
            'Colegio Americano'
        ];

        $totalCreated = 0;

        foreach ($leaders as $leader) {
            $this->command->info("Creando referidos para: {$leader->nombre_completo}");

            for ($i = 1; $i <= 100; $i++) {
                // Seleccionar departamento aleatorio
                $deptKeys = array_keys($departamentos);
                $selectedDept = $deptKeys[array_rand($deptKeys)];
                $municipios = $departamentos[$selectedDept];

                // Crear referido
                $cedula = $faker->unique()->numerify('##########');
                $firstName = $faker->firstName;
                $lastName1 = $faker->lastName;
                $lastName2 = $faker->lastName;
                $nombreCompleto = "{$firstName} {$lastName1} {$lastName2}";

                try {
                    User::create([
                        'cedula' => $cedula,
                        'nombre_completo' => $nombreCompleto,
                        'email' => strtolower(str_replace(' ', '.', $firstName . $lastName1)) . $cedula . '@test.com',
                        'password' => bcrypt('password'), // Contraseña por defecto
                        'celular' => $faker->numerify('3#########'),
                        'barrio' => $barrios[array_rand($barrios)],
                        'departamento_votacion' => $selectedDept,
                        'municipio_votacion' => $municipios[array_rand($municipios)],
                        'puesto_votacion' => $puestosVotacion[array_rand($puestosVotacion)],
                        'direccion_votacion' => $faker->streetAddress,
                        'mesa_votacion' => $faker->numerify('###'),
                        'observaciones' => $i % 5 === 0 ? $faker->sentence : null,
                        'role' => 'member',
                        'is_active' => $i % 10 !== 0, // 90% activos, 10% inactivos
                        'referrer_id' => $leader->id,
                    ]);

                    $totalCreated++;

                    if ($i % 25 === 0) {
                        $this->command->info("  - Creados {$i}/100 referidos para {$leader->nombre_completo}");
                    }
                } catch (\Exception $e) {
                    $this->command->error("Error creando referido {$i} para {$leader->nombre_completo}: " . $e->getMessage());
                    continue;
                }
            }

            $this->command->info("✓ Completados 100 referidos para {$leader->nombre_completo}\n");
        }

        // Actualizar todos los contadores de red correctamente
        $this->command->info("\nActualizando contadores de red...");

        foreach (User::whereNotNull('path')->get() as $user) {
            $directCount = User::where('referrer_id', $user->id)
                ->whereNull('deleted_at')
                ->count();

            $totalCount = User::whereRaw('path <@ ?', [$user->path])
                ->where('id', '!=', $user->id)
                ->whereNull('deleted_at')
                ->count();

            $user->direct_referrals_count = $directCount;
            $user->total_network_count = $totalCount;
            $user->save();
        }

        $this->command->info("\n✓ Seeder completado exitosamente!");
        $this->command->info("Total de referidos creados: {$totalCreated}");
        $this->command->info("Líderes procesados: {$leaders->count()}");
        $this->command->info("Contadores de red actualizados correctamente");
    }
}
