<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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

        $leaders = $query->paginate($request->get('per_page', 15));

        // Agregar estadísticas de red a cada líder
        $leaders->getCollection()->transform(function($leader) {
            return [
                'id' => $leader->id,
                'nombre_completo' => $leader->nombre_completo,
                'cedula' => $leader->cedula,
                'email' => $leader->email,
                'celular' => $leader->celular,
                'referral_code' => $leader->referral_code,
                'level' => $leader->level,
                'is_active' => $leader->is_active,
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
            'nombre_completo' => 'required|string|max:255',
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
        ]);

        // Asignar rol de líder
        $validated['role'] = 'leader';
        $validated['is_active'] = true;

        // Hash de la contraseña
        $validated['password'] = Hash::make($validated['password']);

        $leader = User::create($validated);

        return response()->json([
            'message' => 'Líder creado exitosamente',
            'leader' => [
                'id' => $leader->id,
                'nombre_completo' => $leader->nombre_completo,
                'cedula' => $leader->cedula,
                'email' => $leader->email,
                'referral_code' => $leader->referral_code,
                'level' => $leader->level,
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

        // Cargar relaciones
        $leader->load(['referrer:id,nombre_completo,cedula', 'directReferrals:id,nombre_completo,cedula,role']);

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
            'nombre_completo' => 'sometimes|string|max:255',
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
        ]);

        // Hash de la contraseña si se proporciona
        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $leader->update($validated);

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

        $leader->password = Hash::make($validated['password']);
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
