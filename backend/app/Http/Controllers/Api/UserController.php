<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Listar usuarios/referidos (con paginación y filtros)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = User::query();

        // Filtrar según el rol
        if ($user->isLeader() || $user->isMember()) {
            // Solo ver su red de descendientes
            $query->whereRaw("path <@ ?", [$user->path])
                  ->where('id', '!=', $user->id);
        }

        // Filtros
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('cedula', 'like', "%{$search}%")
                  ->orWhere('nombre_completo', 'like', "%{$search}%")
                  ->orWhere('celular', 'like', "%{$search}%");
            });
        }

        if ($request->has('departamento')) {
            $query->where('departamento_votacion', $request->departamento);
        }

        if ($request->has('municipio')) {
            $query->where('municipio_votacion', $request->municipio);
        }

        if ($request->has('referrer_id')) {
            $query->where('referrer_id', $request->referrer_id);
        }

        // Paginación
        $users = $query->orderBy('created_at', 'desc')
                      ->paginate($request->get('per_page', 15));

        return response()->json($users);
    }

    /**
     * Crear nuevo referido
     */
    public function store(Request $request)
    {
        $authUser = $request->user();

        // Super admin NO puede crear referidos
        if ($authUser->isSuperAdmin()) {
            return response()->json([
                'error' => 'Los super admins no pueden crear referidos directamente'
            ], 403);
        }

        $validated = $request->validate([
            'cedula' => 'required|string|unique:users,cedula',
            'primer_nombre' => 'required|string|max:100',
            'segundo_nombre' => 'nullable|string|max:100',
            'primer_apellido' => 'required|string|max:100',
            'segundo_apellido' => 'nullable|string|max:100',
            'celular' => 'required|string|max:20',
            'barrio' => 'required|string|max:255',
            'departamento_votacion' => 'required|string|max:255',
            'municipio_votacion' => 'required|string|max:255',
            'puesto_votacion' => 'required|string|max:255',
            'direccion_votacion' => 'required|string|max:255',
            'mesa_votacion' => 'required|string|max:50',
            'observaciones' => 'nullable|string',
        ]);

        // El usuario actual (líder o miembro) será el referidor
        $validated['referrer_id'] = $authUser->id;
        $validated['role'] = 'member';

        $newUser = User::create($validated);

        // Incluir código de referido y URL en la respuesta
        $referralUrl = config('app.frontend_url', 'http://localhost:5173') . '/register/' . $newUser->referral_code;

        return response()->json([
            'message' => 'Referido creado exitosamente',
            'user' => $newUser,
            'referral_code' => $newUser->referral_code,
            'referral_url' => $referralUrl,
        ], 201);
    }

    /**
     * Mostrar detalle de un usuario/referido
     */
    public function show(Request $request, $id)
    {
        $authUser = $request->user();
        $user = User::findOrFail($id);

        // Verificar permisos: solo puede ver usuarios de su red (o super admin ve todo)
        if ($authUser->isLeader() || $authUser->isMember()) {
            $descendants = $authUser->getAllDescendants()->pluck('id')->toArray();
            if (!in_array($user->id, $descendants) && $user->id !== $authUser->id) {
                return response()->json(['error' => 'No autorizado'], 403);
            }
        }

        // Incluir referidor y referidos directos
        $user->load(['referrer:id,nombre_completo,cedula', 'directReferrals:id,nombre_completo,cedula,celular']);

        return response()->json($user);
    }

    /**
     * Actualizar usuario/referido
     */
    public function update(Request $request, $id)
    {
        $authUser = $request->user();
        $user = User::findOrFail($id);

        // Verificar permisos
        if ($authUser->isLeader() || $authUser->isMember()) {
            $descendants = $authUser->getAllDescendants()->pluck('id')->toArray();
            if (!in_array($user->id, $descendants) && $user->id !== $authUser->id) {
                return response()->json(['error' => 'No autorizado'], 403);
            }
        }

        $validated = $request->validate([
            'nombre_completo' => 'sometimes|string|max:255',
            'celular' => 'sometimes|string|max:20',
            'barrio' => 'sometimes|string|max:255',
            'departamento_votacion' => 'sometimes|string|max:255',
            'municipio_votacion' => 'sometimes|string|max:255',
            'puesto_votacion' => 'sometimes|string|max:255',
            'direccion_votacion' => 'sometimes|string|max:255',
            'mesa_votacion' => 'sometimes|string|max:50',
            'observaciones' => 'nullable|string',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Usuario actualizado exitosamente',
            'user' => $user
        ]);
    }

    /**
     * Eliminar usuario/referido (soft delete)
     */
    public function destroy(Request $request, $id)
    {
        // Solo super admin puede eliminar
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $user = User::findOrFail($id);
        $user->delete();

        return response()->json([
            'message' => 'Usuario eliminado exitosamente'
        ]);
    }

    /**
     * Obtener información del referidor por código (público)
     * Para validar el código antes de mostrar el formulario
     */
    public function getReferrerByCode($code)
    {
        $referrer = User::where('referral_code', $code)
            ->where('is_active', true)
            ->first();

        if (!$referrer) {
            return response()->json([
                'error' => 'Código de referido inválido o inactivo'
            ], 404);
        }

        return response()->json([
            'referrer' => [
                'id' => $referrer->id,
                'nombre_completo' => $referrer->nombre_completo,
                'cedula' => $referrer->cedula,
                'referral_code' => $referrer->referral_code,
            ]
        ]);
    }

    /**
     * Exportar usuarios a Excel (CSV)
     */
    public function exportToExcel(Request $request)
    {
        $authUser = $request->user();
        $query = User::query();

        // Filtrar según el rol
        if ($authUser->isLeader() || $authUser->isMember()) {
            // Solo ver su red de descendientes
            $query->whereRaw("path <@ ?", [$authUser->path])
                  ->where('id', '!=', $authUser->id);
        }

        // Aplicar filtros
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('cedula', 'like', "%{$search}%")
                  ->orWhere('nombre_completo', 'like', "%{$search}%")
                  ->orWhere('celular', 'like', "%{$search}%");
            });
        }

        if ($request->has('departamento')) {
            $query->where('departamento_votacion', $request->departamento);
        }

        if ($request->has('municipio')) {
            $query->where('municipio_votacion', $request->municipio);
        }

        $users = $query->orderBy('created_at', 'desc')->get();

        // Crear CSV
        $filename = 'usuarios_' . date('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function() use ($users) {
            $file = fopen('php://output', 'w');

            // BOM para UTF-8
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            // Headers
            fputcsv($file, [
                'ID',
                'Cédula',
                'Nombre Completo',
                'Celular',
                'Email',
                'Barrio',
                'Departamento',
                'Municipio',
                'Puesto de Votación',
                'Mesa',
                'Dirección Votación',
                'Rol',
                'Referidos Directos',
                'Red Total',
                'Nivel',
                'Código de Referido',
                'Activo',
                'Fecha Registro',
            ]);

            // Data
            foreach ($users as $user) {
                fputcsv($file, [
                    $user->id,
                    $user->cedula,
                    $user->nombre_completo,
                    $user->celular,
                    $user->email ?? 'N/A',
                    $user->barrio,
                    $user->departamento_votacion,
                    $user->municipio_votacion,
                    $user->puesto_votacion,
                    $user->mesa_votacion,
                    $user->direccion_votacion,
                    $user->role,
                    $user->direct_referrals_count,
                    $user->total_network_count,
                    $user->level,
                    $user->referral_code,
                    $user->is_active ? 'Sí' : 'No',
                    $user->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Registro público usando código de referido (sin autenticación)
     * Permite que cualquier persona se registre usando el código de un referidor
     */
    public function publicRegister(Request $request)
    {
        $validated = $request->validate([
            'referral_code' => 'required|string|exists:users,referral_code',
            'cedula' => 'required|string|unique:users,cedula',
            'primer_nombre' => 'required|string|max:100',
            'segundo_nombre' => 'nullable|string|max:100',
            'primer_apellido' => 'required|string|max:100',
            'segundo_apellido' => 'nullable|string|max:100',
            'celular' => 'required|string|max:20',
            'barrio' => 'required|string|max:255',
            'departamento_votacion' => 'required|string|max:255',
            'municipio_votacion' => 'required|string|max:255',
            'puesto_votacion' => 'required|string|max:255',
            'direccion_votacion' => 'required|string|max:255',
            'mesa_votacion' => 'required|string|max:50',
            'observaciones' => 'nullable|string',
        ]);

        // Encontrar el referidor por código
        $referrer = User::where('referral_code', $validated['referral_code'])
            ->where('is_active', true)
            ->first();

        if (!$referrer) {
            return response()->json([
                'error' => 'Código de referido inválido o inactivo'
            ], 400);
        }

        // Crear el nuevo usuario referido
        $newUser = User::create([
            'cedula' => $validated['cedula'],
            'primer_nombre' => $validated['primer_nombre'],
            'segundo_nombre' => $validated['segundo_nombre'] ?? null,
            'primer_apellido' => $validated['primer_apellido'],
            'segundo_apellido' => $validated['segundo_apellido'] ?? null,
            'celular' => $validated['celular'],
            'barrio' => $validated['barrio'],
            'departamento_votacion' => $validated['departamento_votacion'],
            'municipio_votacion' => $validated['municipio_votacion'],
            'puesto_votacion' => $validated['puesto_votacion'],
            'direccion_votacion' => $validated['direccion_votacion'],
            'mesa_votacion' => $validated['mesa_votacion'],
            'observaciones' => $validated['observaciones'] ?? null,
            'referrer_id' => $referrer->id,
            'role' => 'member',
            'is_active' => true,
        ]);

        return response()->json([
            'message' => '¡Registro exitoso! Has sido registrado en la red de ' . $referrer->nombre_completo,
            'user' => [
                'id' => $newUser->id,
                'nombre_completo' => $newUser->nombre_completo,
                'cedula' => $newUser->cedula,
                'referral_code' => $newUser->referral_code,
                'referrer' => [
                    'nombre_completo' => $referrer->nombre_completo,
                    'cedula' => $referrer->cedula,
                ]
            ]
        ], 201);
    }
}
