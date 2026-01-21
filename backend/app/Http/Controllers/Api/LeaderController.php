<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LeaderController extends Controller
{
    /**
     * Listar todos los líderes
     * Solo super admin puede acceder
     */
    public function index(Request $request)
    {
        // Verificar que sea super admin
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $query = User::where('role', 'leader');

        // Filtros
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('cedula', 'like', "%{$search}%")
                  ->orWhere('nombre_completo', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('celular', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Ordenar por red más grande por defecto
        $orderBy = $request->get('order_by', 'total_network_count');
        $orderDirection = $request->get('order_direction', 'desc');
        $query->orderBy($orderBy, $orderDirection);

        // Cargar relaciones ADN
        $query->with(['lineas:id,nombre,color', 'oks:id,nombre,color']);

        $leaders = $query->paginate($request->get('per_page', 15));

        // Agregar estadísticas de red a cada líder
        $leaders->getCollection()->transform(function($leader) {
            return [
                'id' => $leader->id,
                'nombre_completo' => $leader->nombre_completo,
                'primer_nombre' => $leader->primer_nombre,
                'segundo_nombre' => $leader->segundo_nombre,
                'primer_apellido' => $leader->primer_apellido,
                'segundo_apellido' => $leader->segundo_apellido,
                'cedula' => $leader->cedula,
                'email' => $leader->email,
                'celular' => $leader->celular,
                'referral_code' => $leader->referral_code,
                'level' => $leader->level,
                'is_active' => $leader->is_active,
                'adn_type' => $leader->adn_type,
                'lineas' => $leader->lineas,
                'oks' => $leader->oks,
                'direct_referrals_count' => $leader->direct_referrals_count,
                'total_network_count' => $leader->total_network_count,
                'created_at' => $leader->created_at->toISOString(),
                'referrer' => $leader->referrer ? [
                    'id' => $leader->referrer->id,
                    'nombre_completo' => $leader->referrer->nombre_completo,
                ] : null,
            ];
        });

        return response()->json($leaders);
    }

    /**
     * Crear nuevo líder
     * Solo super admin puede acceder
     */
    public function store(Request $request)
    {
        // Verificar que sea super admin
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $validated = $request->validate([
            'cedula' => 'required|string|unique:users,cedula',
            'primer_nombre' => 'required|string|max:100',
            'segundo_nombre' => 'nullable|string|max:100',
            'primer_apellido' => 'required|string|max:100',
            'segundo_apellido' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'celular' => 'required|string|max:20',
            'barrio' => 'required|string|max:255',
            'departamento_votacion' => 'required|string|max:255',
            'municipio_votacion' => 'required|string|max:255',
            'puesto_votacion' => 'required|string|max:255',
            'direccion_votacion' => 'required|string|max:255',
            'mesa_votacion' => 'required|string|max:50',
            'observaciones' => 'nullable|string',
            'referrer_id' => 'nullable|exists:users,id',
            // Campos ADN
            'adn_type' => 'nullable|in:linea,ok',
            'linea_ids' => 'nullable|array',
            'linea_ids.*' => 'exists:lineas,id',
            'ok_ids' => 'nullable|array',
            'ok_ids.*' => 'exists:oks,id',
        ]);

        // Validar exclusividad mutua de ADN
        if (!empty($validated['linea_ids']) && !empty($validated['ok_ids'])) {
            return response()->json([
                'error' => 'Un líder no puede pertenecer a Líneas y OKs simultáneamente'
            ], 422);
        }

        // Asignar rol de líder
        $validated['role'] = 'leader';
        $validated['is_active'] = true;

        // Determinar tipo ADN basado en los IDs proporcionados
        if (!empty($validated['linea_ids'])) {
            $validated['adn_type'] = 'linea';
        } elseif (!empty($validated['ok_ids'])) {
            $validated['adn_type'] = 'ok';
        }

        // Extraer IDs de ADN antes de crear
        $lineaIds = $validated['linea_ids'] ?? [];
        $okIds = $validated['ok_ids'] ?? [];
        unset($validated['linea_ids'], $validated['ok_ids']);

        // Nota: No se hace Hash::make() porque el modelo User tiene cast 'hashed' para password
        $leader = User::create($validated);

        // Asignar relaciones ADN
        if (!empty($lineaIds)) {
            $leader->lineas()->sync($lineaIds);
        } elseif (!empty($okIds)) {
            $leader->oks()->sync($okIds);
        }

        return response()->json([
            'message' => 'Líder creado exitosamente',
            'leader' => [
                'id' => $leader->id,
                'nombre_completo' => $leader->nombre_completo,
                'cedula' => $leader->cedula,
                'email' => $leader->email,
                'referral_code' => $leader->referral_code,
                'level' => $leader->level,
                'adn_type' => $leader->adn_type,
            ]
        ], 201);
    }

    /**
     * Mostrar detalle de un líder específico
     */
    public function show(Request $request, $id)
    {
        // Verificar que sea super admin
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $leader = User::where('role', 'leader')->findOrFail($id);

        // Cargar relaciones incluyendo ADN
        $leader->load([
            'referrer:id,nombre_completo,cedula',
            'directReferrals:id,nombre_completo,cedula,role,celular,municipio_votacion,is_active,direct_referrals_count',
            'lineas:id,nombre,color',
            'oks:id,nombre,color'
        ]);

        // Obtener estadísticas de red
        $networkStats = $leader->getNetworkStats();

        return response()->json([
            'leader' => $leader,
            'network_stats' => $networkStats,
        ]);
    }

    /**
     * Actualizar información de un líder
     */
    public function update(Request $request, $id)
    {
        // Verificar que sea super admin
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $leader = User::where('role', 'leader')->findOrFail($id);

        $validated = $request->validate([
            'primer_nombre' => 'sometimes|string|max:100',
            'segundo_nombre' => 'nullable|string|max:100',
            'primer_apellido' => 'sometimes|string|max:100',
            'segundo_apellido' => 'sometimes|string|max:100',
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($leader->id)],
            'password' => 'sometimes|string|min:6',
            'celular' => 'sometimes|string|max:20',
            'barrio' => 'sometimes|string|max:255',
            'departamento_votacion' => 'sometimes|string|max:255',
            'municipio_votacion' => 'sometimes|string|max:255',
            'puesto_votacion' => 'sometimes|string|max:255',
            'direccion_votacion' => 'sometimes|string|max:255',
            'mesa_votacion' => 'sometimes|string|max:50',
            'observaciones' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
            // Campos ADN
            'adn_type' => 'nullable|in:linea,ok',
            'linea_ids' => 'nullable|array',
            'linea_ids.*' => 'exists:lineas,id',
            'ok_ids' => 'nullable|array',
            'ok_ids.*' => 'exists:oks,id',
        ]);

        // Validar exclusividad mutua de ADN
        if (!empty($validated['linea_ids']) && !empty($validated['ok_ids'])) {
            return response()->json([
                'error' => 'Un líder no puede pertenecer a Líneas y OKs simultáneamente'
            ], 422);
        }

        // Extraer IDs de ADN antes de actualizar
        $lineaIds = $validated['linea_ids'] ?? null;
        $okIds = $validated['ok_ids'] ?? null;
        unset($validated['linea_ids'], $validated['ok_ids']);

        // Determinar tipo ADN basado en los IDs proporcionados
        if ($lineaIds !== null || $okIds !== null) {
            if (!empty($lineaIds)) {
                $validated['adn_type'] = 'linea';
            } elseif (!empty($okIds)) {
                $validated['adn_type'] = 'ok';
            } else {
                $validated['adn_type'] = null;
            }
        }

        // Nota: No se hace Hash::make() porque el modelo User tiene cast 'hashed' para password
        $leader->update($validated);

        // Actualizar relaciones ADN si se proporcionaron
        if ($lineaIds !== null) {
            $leader->oks()->detach(); // Limpiar OKs
            $leader->lineas()->sync($lineaIds);
        } elseif ($okIds !== null) {
            $leader->lineas()->detach(); // Limpiar líneas
            $leader->oks()->sync($okIds);
        }

        // Recargar relaciones
        $leader->load(['lineas:id,nombre,color', 'oks:id,nombre,color']);

        return response()->json([
            'message' => 'Líder actualizado exitosamente',
            'leader' => $leader
        ]);
    }

    /**
     * Eliminar/Desactivar un líder
     */
    public function destroy(Request $request, $id)
    {
        // Verificar que sea super admin
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $leader = User::where('role', 'leader')->findOrFail($id);

        // Verificar si tiene red activa
        if ($leader->total_network_count > 0) {
            return response()->json([
                'error' => 'No se puede eliminar un líder con red activa',
                'network_count' => $leader->total_network_count
            ], 422);
        }

        // Soft delete
        $leader->delete();

        return response()->json([
            'message' => 'Líder eliminado exitosamente'
        ]);
    }

    /**
     * Activar/Desactivar un líder (sin eliminarlo)
     */
    public function toggleActive(Request $request, $id)
    {
        // Verificar que sea super admin
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $leader = User::where('role', 'leader')->findOrFail($id);
        $leader->is_active = !$leader->is_active;
        $leader->save();

        return response()->json([
            'message' => $leader->is_active ? 'Líder activado' : 'Líder desactivado',
            'leader' => [
                'id' => $leader->id,
                'nombre_completo' => $leader->nombre_completo,
                'is_active' => $leader->is_active,
            ]
        ]);
    }

    /**
     * Cambiar contraseña de un líder
     */
    public function changePassword(Request $request, $id)
    {
        // Verificar que sea super admin
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $leader = User::where('role', 'leader')->findOrFail($id);

        $validated = $request->validate([
            'password' => 'required|string|min:6|confirmed',
        ]);

        // El cast 'hashed' del modelo se encarga de hashear automáticamente
        $leader->password = $validated['password'];
        $leader->save();

        return response()->json([
            'message' => 'Contraseña actualizada exitosamente',
        ]);
    }

    /**
     * Obtener estadísticas de todos los líderes
     */
    public function stats(Request $request)
    {
        // Verificar que sea super admin
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $stats = [
            'total_leaders' => User::where('role', 'leader')->count(),
            'active_leaders' => User::where('role', 'leader')->where('is_active', true)->count(),
            'inactive_leaders' => User::where('role', 'leader')->where('is_active', false)->count(),
            'leaders_with_network' => User::where('role', 'leader')->where('total_network_count', '>', 0)->count(),
            'average_network_size' => User::where('role', 'leader')->avg('total_network_count'),
            'top_leaders' => User::where('role', 'leader')
                ->orderBy('total_network_count', 'desc')
                ->limit(5)
                ->get(['id', 'nombre_completo', 'cedula', 'total_network_count', 'direct_referrals_count']),
        ];

        return response()->json($stats);
    }
}
