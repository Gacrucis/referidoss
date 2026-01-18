<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class TreeController extends Controller
{
    /**
     * Obtener árbol jerárquico completo para visualización D3.js
     * Con lazy loading opcional por nivel de profundidad
     */
    public function getTree(Request $request)
    {
        $user = $request->user();
        $maxDepth = $request->get('max_depth', 5);

        // Super admin puede ver cualquier árbol, o el árbol completo
        if ($user->isSuperAdmin()) {
            $rootUserId = $request->get('user_id');

            if ($rootUserId) {
                $rootUser = User::findOrFail($rootUserId);
            } else {
                // Si no se especifica root, tomar el primer líder o super admin
                $rootUser = User::whereIn('role', ['super_admin', 'leader'])
                    ->where('level', 0)
                    ->orderBy('created_at', 'asc')
                    ->first();

                if (!$rootUser) {
                    return response()->json([
                        'error' => 'No hay usuarios raíz en el sistema'
                    ], 404);
                }
            }
        } else {
            // Líderes y members solo ven su propia red
            $rootUser = $user;
        }

        $treeData = $rootUser->getTreeData($maxDepth);

        // Obtener estadísticas del árbol
        $stats = [
            'total_nodes' => $rootUser->total_network_count + 1,
            'max_depth' => User::whereRaw("path <@ ?", [$rootUser->path])->max('level') ?? 0,
            'total_leaders' => User::whereRaw("path <@ ?", [$rootUser->path])
                ->where('role', 'leader')
                ->count(),
        ];

        return response()->json([
            'tree' => $treeData,
            'stats' => $stats,
        ]);
    }

    /**
     * Obtener descendientes directos de un nodo específico
     * Útil para lazy loading en el árbol D3.js
     */
    public function getDescendants(Request $request, $userId)
    {
        $authUser = $request->user();
        $targetUser = User::findOrFail($userId);

        // Verificar permisos
        if (!$authUser->isSuperAdmin()) {
            // Verificar que el usuario objetivo está en la red del usuario autenticado
            $isInNetwork = $authUser->getAllDescendants()->pluck('id')->contains($targetUser->id)
                           || $targetUser->id === $authUser->id;

            if (!$isInNetwork) {
                return response()->json(['error' => 'No autorizado'], 403);
            }
        }

        // Obtener solo descendientes directos (nivel inmediatamente inferior)
        $directDescendants = User::where('referrer_id', $targetUser->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($user) {
                return [
                    'id' => $user->id,
                    'nombre_completo' => $user->nombre_completo,
                    'cedula' => $user->cedula,
                    'referral_code' => $user->referral_code,
                    'direct_referrals_count' => $user->direct_referrals_count,
                    'total_network_count' => $user->total_network_count,
                    'level' => $user->level,
                    'created_at' => $user->created_at->toISOString(),
                    'has_children' => $user->direct_referrals_count > 0,
                ];
            });

        return response()->json([
            'descendants' => $directDescendants,
            'parent' => [
                'id' => $targetUser->id,
                'nombre_completo' => $targetUser->nombre_completo,
                'level' => $targetUser->level,
            ]
        ]);
    }

    /**
     * Obtener estadísticas del árbol completo
     */
    public function getTreeStats(Request $request)
    {
        $user = $request->user();

        if ($user->isSuperAdmin()) {
            // Estadísticas globales
            $stats = [
                'total_users' => User::count(),
                'total_leaders' => User::where('role', 'leader')->count(),
                'total_members' => User::where('role', 'member')->count(),
                'max_depth' => User::max('level'),
                'average_referrals_per_leader' => User::where('role', 'leader')
                    ->avg('direct_referrals_count'),
                'total_active_users' => User::where('is_active', true)->count(),
            ];
        } else {
            // Estadísticas de la red del usuario
            $stats = $user->getNetworkStats();
        }

        return response()->json($stats);
    }

    /**
     * Buscar usuarios en el árbol
     */
    public function search(Request $request)
    {
        $user = $request->user();
        $search = $request->get('query');

        if (empty($search)) {
            return response()->json(['results' => []]);
        }

        $query = User::query();

        // Filtrar por red si no es super admin
        if (!$user->isSuperAdmin()) {
            $query->whereRaw("path <@ ?", [$user->path])
                  ->where('id', '!=', $user->id);
        }

        // Buscar por cédula, nombre o celular
        $results = $query->where(function($q) use ($search) {
            $q->where('cedula', 'like', "%{$search}%")
              ->orWhere('nombre_completo', 'like', "%{$search}%")
              ->orWhere('celular', 'like', "%{$search}%")
              ->orWhere('referral_code', 'like', "%{$search}%");
        })
        ->limit(20)
        ->get()
        ->map(function($user) {
            return [
                'id' => $user->id,
                'nombre_completo' => $user->nombre_completo,
                'cedula' => $user->cedula,
                'celular' => $user->celular,
                'referral_code' => $user->referral_code,
                'level' => $user->level,
                'path' => $user->path,
                'direct_referrals_count' => $user->direct_referrals_count,
                'total_network_count' => $user->total_network_count,
            ];
        });

        return response()->json(['results' => $results]);
    }
}
