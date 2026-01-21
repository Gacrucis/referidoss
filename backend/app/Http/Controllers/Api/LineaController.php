<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Linea;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LineaController extends Controller
{
    /**
     * Listar todas las líneas con paginación y estadísticas
     */
    public function index(Request $request)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $query = Linea::withCount('leaders')
            ->with(['leaders:id,total_network_count']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('nombre', 'ilike', "%{$search}%");
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $lineas = $query->orderBy('nombre')->paginate($request->get('per_page', 15));

        // Agregar total de red para cada línea
        $lineas->getCollection()->transform(function ($linea) {
            $totalNetwork = $linea->leaders->sum('total_network_count');
            return [
                'id' => $linea->id,
                'nombre' => $linea->nombre,
                'descripcion' => $linea->descripcion,
                'color' => $linea->color,
                'is_active' => $linea->is_active,
                'leaders_count' => $linea->leaders_count,
                'total_network' => $totalNetwork,
                'created_at' => $linea->created_at,
                'updated_at' => $linea->updated_at,
            ];
        });

        return response()->json($lineas);
    }

    /**
     * Obtener todas las líneas activas (para selects)
     */
    public function getActive(Request $request)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $lineas = Linea::where('is_active', true)
                       ->orderBy('nombre')
                       ->get(['id', 'nombre', 'color']);

        return response()->json($lineas);
    }

    /**
     * Crear nueva línea
     */
    public function store(Request $request)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $validated = $request->validate([
            'nombre' => 'required|string|max:255|unique:lineas,nombre',
            'descripcion' => 'nullable|string|max:500',
            'color' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        $linea = Linea::create($validated);

        return response()->json([
            'message' => 'Línea creada exitosamente',
            'linea' => $linea,
        ], 201);
    }

    /**
     * Mostrar detalle de una línea con estadísticas completas
     */
    public function show(Request $request, $id)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $linea = Linea::withCount('leaders')
                      ->with(['leaders:id,nombre_completo,cedula,email,celular,is_active,direct_referrals_count,total_network_count'])
                      ->findOrFail($id);

        // Calcular estadísticas totales
        $totalNetwork = $linea->leaders->sum('total_network_count');
        $totalDirectReferrals = $linea->leaders->sum('direct_referrals_count');
        $activeLeaders = $linea->leaders->where('is_active', true)->count();

        return response()->json([
            'linea' => $linea,
            'stats' => [
                'leaders_count' => $linea->leaders_count,
                'active_leaders' => $activeLeaders,
                'total_direct_referrals' => $totalDirectReferrals,
                'total_network' => $totalNetwork,
            ]
        ]);
    }

    /**
     * Actualizar línea
     */
    public function update(Request $request, $id)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $linea = Linea::findOrFail($id);

        $validated = $request->validate([
            'nombre' => ['sometimes', 'string', 'max:255', Rule::unique('lineas')->ignore($linea->id)],
            'descripcion' => 'nullable|string|max:500',
            'color' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
            'is_active' => 'sometimes|boolean',
        ]);

        $linea->update($validated);

        return response()->json([
            'message' => 'Línea actualizada exitosamente',
            'linea' => $linea,
        ]);
    }

    /**
     * Eliminar línea
     */
    public function destroy(Request $request, $id)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $linea = Linea::withCount('leaders')->findOrFail($id);

        if ($linea->leaders_count > 0) {
            return response()->json([
                'error' => 'No se puede eliminar una línea con líderes asignados',
                'leaders_count' => $linea->leaders_count,
            ], 422);
        }

        $linea->delete();

        return response()->json(['message' => 'Línea eliminada exitosamente']);
    }
}
