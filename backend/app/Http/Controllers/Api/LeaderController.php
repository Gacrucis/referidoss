<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class LeaderController extends Controller
{
    /**
     * Listar todos los líderes
     */
    public function index(Request $request)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $query = User::where('role', 'leader');

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

        $orderBy = $request->get('order_by', 'total_network_count');
        $orderDirection = $request->get('order_direction', 'desc');
        $query->orderBy($orderBy, $orderDirection);

        $query->with(['lineas:id,nombre,color', 'oks:id,nombre,color', 'referrer:id,nombre_completo']);

        $leaders = $query->paginate($request->get('per_page', 15));

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
                'referrer' => $leader->referrer,
            ];
        });

        return response()->json($leaders);
    }

    /**
     * Crear nuevo líder
     */
    public function store(Request $request)
    {
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
            'linea_ids' => 'nullable|array',
            'linea_ids.*' => 'exists:lineas,id',
            'ok_ids' => 'nullable|array',
            'ok_ids.*' => 'exists:oks,id',
        ]);

        if (!empty($validated['linea_ids']) && !empty($validated['ok_ids'])) {
            return response()->json(['error' => 'Un líder no puede pertenecer a Líneas y OKs simultáneamente'], 422);
        }

        return DB::transaction(function () use ($validated) {
            $lineaIds = $validated['linea_ids'] ?? [];
            $okIds = $validated['ok_ids'] ?? [];
            
            $validated['role'] = 'leader';
            $validated['is_active'] = true;
            $validated['adn_type'] = !empty($lineaIds) ? 'linea' : (!empty($okIds) ? 'ok' : null);

            unset($validated['linea_ids'], $validated['ok_ids']);

            $leader = User::create($validated);

            if ($validated['adn_type'] === 'linea') {
                $leader->lineas()->sync($lineaIds);
            } elseif ($validated['adn_type'] === 'ok') {
                $leader->oks()->sync($okIds);
            }

            return response()->json(['message' => 'Líder creado exitosamente', 'leader' => $leader], 201);
        });
    }

    /**
     * Actualizar información de un líder (CORREGIDO)
     */
    public function update(Request $request, $id)
    {
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
            'linea_ids' => 'nullable|array',
            'linea_ids.*' => 'exists:lineas,id',
            'ok_ids' => 'nullable|array',
            'ok_ids.*' => 'exists:oks,id',
        ]);

        // Validación de exclusividad
        if (!empty($request->linea_ids) && !empty($request->ok_ids)) {
            return response()->json(['error' => 'No puede tener Líneas y OKs simultáneamente'], 422);
        }

        return DB::transaction(function () use ($leader, $validated, $request) {
            // Manejo de ADN: Solo si se enviaron los campos en el request
            $hasLineaIds = $request->has('linea_ids');
            $hasOkIds = $request->has('ok_ids');

            if ($hasLineaIds || $hasOkIds) {
                if (!empty($request->linea_ids)) {
                    $leader->oks()->detach(); // Limpiar el otro tipo
                    $leader->lineas()->sync($request->linea_ids);
                    $validated['adn_type'] = 'linea';
                } elseif (!empty($request->ok_ids)) {
                    $leader->lineas()->detach(); // Limpiar el otro tipo
                    $leader->oks()->sync($request->ok_ids);
                    $validated['adn_type'] = 'ok';
                } else {
                    // Si ambos se enviaron como arrays vacíos, se limpia el ADN
                    $leader->lineas()->detach();
                    $leader->oks()->detach();
                    $validated['adn_type'] = null;
                }
            }

            unset($validated['linea_ids'], $validated['ok_ids']);
            $leader->update($validated);
            
            // Recargar para devolver datos frescos
            $leader->refresh();
            $leader->load(['lineas:id,nombre,color', 'oks:id,nombre,color']);

            return response()->json([
                'message' => 'Líder actualizado exitosamente',
                'leader' => $leader
            ]);
        });
    }

    /**
     * Mostrar detalle de un líder específico
     */
    public function show(Request $request, $id)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $leader = User::where('role', 'leader')->findOrFail($id);
        $leader->load([
            'referrer:id,nombre_completo,cedula',
            'directReferrals:id,nombre_completo,cedula,role,celular,is_active',
            'lineas:id,nombre,color',
            'oks:id,nombre,color'
        ]);

        return response()->json([
            'leader' => $leader,
            'network_stats' => $leader->getNetworkStats(),
        ]);
    }

    /**
     * Eliminar/Desactivar un líder
     */
    public function destroy(Request $request, $id)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $leader = User::where('role', 'leader')->findOrFail($id);

        if ($leader->total_network_count > 0) {
            return response()->json([
                'error' => 'No se puede eliminar un líder con red activa',
                'network_count' => $leader->total_network_count
            ], 422);
        }

        $leader->delete();
        return response()->json(['message' => 'Líder eliminado exitosamente']);
    }

    /**
     * Activar/Desactivar un líder
     */
    public function toggleActive(Request $request, $id)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $leader = User::where('role', 'leader')->findOrFail($id);
        $leader->is_active = !$leader->is_active;
        $leader->save();

        return response()->json([
            'message' => $leader->is_active ? 'Líder activado' : 'Líder desactivado',
            'leader' => ['id' => $leader->id, 'is_active' => $leader->is_active]
        ]);
    }

    /**
     * Cambiar contraseña
     */
    public function changePassword(Request $request, $id)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $leader = User::where('role', 'leader')->findOrFail($id);
        $validated = $request->validate(['password' => 'required|string|min:6|confirmed']);

        $leader->password = $validated['password'];
        $leader->save();

        return response()->json(['message' => 'Contraseña actualizada exitosamente']);
    }

    /**
     * Estadísticas globales
     */
    public function stats(Request $request)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        return response()->json([
            'total_leaders' => User::where('role', 'leader')->count(),
            'active_leaders' => User::where('role', 'leader')->where('is_active', true)->count(),
            'inactive_leaders' => User::where('role', 'leader')->where('is_active', false)->count(),
            'average_network_size' => User::where('role', 'leader')->avg('total_network_count'),
            'top_leaders' => User::where('role', 'leader')
                ->orderBy('total_network_count', 'desc')
                ->limit(5)
                ->get(['id', 'nombre_completo', 'total_network_count']),
        ]);
    }
}
