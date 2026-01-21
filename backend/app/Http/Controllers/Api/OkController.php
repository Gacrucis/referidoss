<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ok;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OkController extends Controller
{
    /**
     * Listar todos los OKs con paginación y estadísticas
     */
    public function index(Request $request)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $query = Ok::withCount('leaders')
            ->with(['leaders:id,total_network_count']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('nombre', 'ilike', "%{$search}%");
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $oks = $query->orderBy('nombre')->paginate($request->get('per_page', 15));

        // Agregar total de red para cada OK
        $oks->getCollection()->transform(function ($ok) {
            $totalNetwork = $ok->leaders->sum('total_network_count');
            return [
                'id' => $ok->id,
                'nombre' => $ok->nombre,
                'descripcion' => $ok->descripcion,
                'color' => $ok->color,
                'is_active' => $ok->is_active,
                'leaders_count' => $ok->leaders_count,
                'total_network' => $totalNetwork,
                'created_at' => $ok->created_at,
                'updated_at' => $ok->updated_at,
            ];
        });

        return response()->json($oks);
    }

    /**
     * Obtener todos los OKs activos (para selects)
     */
    public function getActive(Request $request)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $oks = Ok::where('is_active', true)
                 ->orderBy('nombre')
                 ->get(['id', 'nombre', 'color']);

        return response()->json($oks);
    }

    /**
     * Crear nuevo OK
     */
    public function store(Request $request)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $validated = $request->validate([
            'nombre' => 'required|string|max:255|unique:oks,nombre',
            'descripcion' => 'nullable|string|max:500',
            'color' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        $ok = Ok::create($validated);

        return response()->json([
            'message' => 'OK creado exitosamente',
            'ok' => $ok,
        ], 201);
    }

    /**
     * Mostrar detalle de un OK con estadísticas completas
     */
    public function show(Request $request, $id)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $ok = Ok::withCount('leaders')
                ->with(['leaders:id,nombre_completo,cedula,email,celular,is_active,direct_referrals_count,total_network_count'])
                ->findOrFail($id);

        // Calcular estadísticas totales
        $totalNetwork = $ok->leaders->sum('total_network_count');
        $totalDirectReferrals = $ok->leaders->sum('direct_referrals_count');
        $activeLeaders = $ok->leaders->where('is_active', true)->count();

        return response()->json([
            'ok' => $ok,
            'stats' => [
                'leaders_count' => $ok->leaders_count,
                'active_leaders' => $activeLeaders,
                'total_direct_referrals' => $totalDirectReferrals,
                'total_network' => $totalNetwork,
            ]
        ]);
    }

    /**
     * Actualizar OK
     */
    public function update(Request $request, $id)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $ok = Ok::findOrFail($id);

        $validated = $request->validate([
            'nombre' => ['sometimes', 'string', 'max:255', Rule::unique('oks')->ignore($ok->id)],
            'descripcion' => 'nullable|string|max:500',
            'color' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
            'is_active' => 'sometimes|boolean',
        ]);

        $ok->update($validated);

        return response()->json([
            'message' => 'OK actualizado exitosamente',
            'ok' => $ok,
        ]);
    }

    /**
     * Eliminar OK
     */
    public function destroy(Request $request, $id)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $ok = Ok::withCount('leaders')->findOrFail($id);

        if ($ok->leaders_count > 0) {
            return response()->json([
                'error' => 'No se puede eliminar un OK con líderes asignados',
                'leaders_count' => $ok->leaders_count,
            ], 422);
        }

        $ok->delete();

        return response()->json(['message' => 'OK eliminado exitosamente']);
    }
}
