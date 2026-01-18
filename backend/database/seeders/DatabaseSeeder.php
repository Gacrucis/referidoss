<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Crear Super Admin
        $superAdmin = User::create([
            'email' => 'admin@referidos.com',
            'password' => Hash::make('admin123'),
            'role' => 'super_admin',
            'cedula' => '1000000001',
            'nombre_completo' => 'Super Administrador',
            'celular' => '3001234567',
            'barrio' => 'Centro',
            'departamento_votacion' => 'Santander',
            'municipio_votacion' => 'Bucaramanga',
            'puesto_votacion' => 'Puesto Central',
            'direccion_votacion' => 'Calle 1 # 1-1',
            'mesa_votacion' => '001',
            'observaciones' => 'Usuario super administrador del sistema',
            'is_active' => true,
        ]);

        // Actualizar path del super admin después de crearlo
        $superAdmin->updatePath();

        // 2. Crear Líderes de prueba
        $leader1 = User::create([
            'email' => 'leader1@referidos.com',
            'password' => Hash::make('leader123'),
            'role' => 'leader',
            'cedula' => '1000000002',
            'nombre_completo' => 'Juan Carlos Pérez',
            'celular' => '3101234567',
            'barrio' => 'Cabecera',
            'departamento_votacion' => 'Santander',
            'municipio_votacion' => 'Bucaramanga',
            'puesto_votacion' => 'Colegio Nacional',
            'direccion_votacion' => 'Carrera 27 # 45-32',
            'mesa_votacion' => '010',
            'referrer_id' => null, // Líder sin referidor
            'is_active' => true,
        ]);
        $leader1->updatePath();

        $leader2 = User::create([
            'email' => 'leader2@referidos.com',
            'password' => Hash::make('leader123'),
            'role' => 'leader',
            'cedula' => '1000000003',
            'nombre_completo' => 'María López Gómez',
            'celular' => '3201234567',
            'barrio' => 'Provenza',
            'departamento_votacion' => 'Santander',
            'municipio_votacion' => 'Floridablanca',
            'puesto_votacion' => 'Escuela La Cumbre',
            'direccion_votacion' => 'Calle 5 # 10-20',
            'mesa_votacion' => '025',
            'referrer_id' => null,
            'is_active' => true,
        ]);
        $leader2->updatePath();

        // 3. Crear Referidos para Líder 1 (Nivel 1)
        $referido1_1 = User::create([
            'role' => 'member',
            'cedula' => '2000000001',
            'nombre_completo' => 'Pedro Martínez',
            'celular' => '3301234567',
            'barrio' => 'San Francisco',
            'departamento_votacion' => 'Santander',
            'municipio_votacion' => 'Bucaramanga',
            'puesto_votacion' => 'Colegio San Pedro',
            'direccion_votacion' => 'Calle 10 # 15-20',
            'mesa_votacion' => '012',
            'referrer_id' => $leader1->id,
            'is_active' => true,
        ]);
        $referido1_1->updatePath();

        $referido1_2 = User::create([
            'role' => 'member',
            'cedula' => '2000000002',
            'nombre_completo' => 'Ana García',
            'celular' => '3401234567',
            'barrio' => 'Lagos del Cacique',
            'departamento_votacion' => 'Santander',
            'municipio_votacion' => 'Bucaramanga',
            'puesto_votacion' => 'Unidad Deportiva',
            'direccion_votacion' => 'Carrera 35 # 50-10',
            'mesa_votacion' => '015',
            'referrer_id' => $leader1->id,
            'is_active' => true,
        ]);
        $referido1_2->updatePath();

        // 4. Crear Sub-referidos (Nivel 2 - referidos de referidos)
        $referido2_1 = User::create([
            'role' => 'member',
            'cedula' => '3000000001',
            'nombre_completo' => 'Carlos Ruiz',
            'celular' => '3501234567',
            'barrio' => 'Álamos',
            'departamento_votacion' => 'Santander',
            'municipio_votacion' => 'Bucaramanga',
            'puesto_votacion' => 'Centro Comunal Álamos',
            'direccion_votacion' => 'Carrera 15 # 20-30',
            'mesa_votacion' => '020',
            'referrer_id' => $referido1_1->id,
            'is_active' => true,
        ]);
        $referido2_1->updatePath();

        $referido2_2 = User::create([
            'role' => 'member',
            'cedula' => '3000000002',
            'nombre_completo' => 'Luisa Fernández',
            'celular' => '3601234567',
            'barrio' => 'Morrorico',
            'departamento_votacion' => 'Santander',
            'municipio_votacion' => 'Bucaramanga',
            'puesto_votacion' => 'Estadio Morrorico',
            'direccion_votacion' => 'Calle 50 # 30-15',
            'mesa_votacion' => '030',
            'referrer_id' => $referido1_1->id,
            'is_active' => true,
        ]);
        $referido2_2->updatePath();

        // 5. Crear referidos para Líder 2
        $referido2_leader2 = User::create([
            'role' => 'member',
            'cedula' => '4000000001',
            'nombre_completo' => 'Roberto Sánchez',
            'celular' => '3701234567',
            'barrio' => 'Cañaveral',
            'departamento_votacion' => 'Santander',
            'municipio_votacion' => 'Floridablanca',
            'puesto_votacion' => 'Escuela Cañaveral',
            'direccion_votacion' => 'Carrera 8 # 12-25',
            'mesa_votacion' => '040',
            'referrer_id' => $leader2->id,
            'is_active' => true,
        ]);
        $referido2_leader2->updatePath();

        // 6. Nivel 3 - más profundidad en el árbol
        $referido3_1 = User::create([
            'role' => 'member',
            'cedula' => '5000000001',
            'nombre_completo' => 'Diana Torres',
            'celular' => '3801234567',
            'barrio' => 'Kennedy',
            'departamento_votacion' => 'Santander',
            'municipio_votacion' => 'Bucaramanga',
            'puesto_votacion' => 'Colegio Kennedy',
            'direccion_votacion' => 'Calle 25 # 18-40',
            'mesa_votacion' => '050',
            'referrer_id' => $referido2_1->id,
            'is_active' => true,
        ]);
        $referido3_1->updatePath();

        $this->command->info('Database seeded successfully!');
        $this->command->info('');
        $this->command->info('=== CREDENCIALES DE ACCESO ===');
        $this->command->info('Super Admin:');
        $this->command->info('  Email: admin@referidos.com');
        $this->command->info('  Password: admin123');
        $this->command->info('');
        $this->command->info('Líder 1:');
        $this->command->info('  Email: leader1@referidos.com');
        $this->command->info('  Password: leader123');
        $this->command->info('');
        $this->command->info('Líder 2:');
        $this->command->info('  Email: leader2@referidos.com');
        $this->command->info('  Password: leader123');
        $this->command->info('==============================');
    }
}
