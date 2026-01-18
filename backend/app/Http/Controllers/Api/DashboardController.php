<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Obtener estadísticas del dashboard según el rol del usuario
     */
    public function getStats(Request $request)
    {
        $user = $request->user();

        if ($user->isSuperAdmin()) {
            return $this->getSuperAdminStats();
        } elseif ($user->isLeader() || $user->isMember()) {
            return $this->getLeaderStats($user);
        }

        return response()->json(['error' => 'Rol no válido'], 403);
    }

    /**
     * Estadísticas para Super Admin
     */
    private function getSuperAdminStats()
    {
        // Total de líderes y personas
        $totalLeaders = User::where('role', 'leader')->count();
        $totalUsers = User::count();
        $totalMembers = User::where('role', 'member')->count();

        // Crecimiento últimos 30 días
        $growthLast30Days = User::where('created_at', '>=', now()->subDays(30))
            ->whereNull('deleted_at')
            ->count();

        return response()->json([
            'total_users' => $totalUsers,
            'total_leaders' => $totalLeaders,
            'total_members' => $totalMembers,
            'growth_last_30_days' => $growthLast30Days,
        ]);
    }

    /**
     * Estadísticas para Líder o Miembro
     */
    private function getLeaderStats(User $user)
    {
        // Estadísticas de la red
        $stats = $user->getNetworkStats();

        // Retornar solo las estadísticas en formato plano
        return response()->json($stats);
    }

    /**
     * Obtener datos de crecimiento
     */
    public function getGrowthData(Request $request)
    {
        $user = $request->user();
        // Validar y sanitizar el parámetro days para prevenir SQL injection
        $days = max(1, min((int)$request->get('days', 30), 365));

        if ($user->isSuperAdmin()) {
            // Crecimiento global - usar query builder para mayor seguridad
            $growth = User::selectRaw('DATE(created_at) as date, COUNT(*) as count')
                ->where('created_at', '>=', now()->subDays($days))
                ->whereNull('deleted_at')
                ->groupByRaw('DATE(created_at)')
                ->orderBy('date')
                ->get()
                ->toArray();
        } else {
            // Crecimiento de mi red
            $growth = $user->getGrowthByDate($days);
        }

        return response()->json(array_map(function($row) {
            return [
                'date' => is_object($row) ? $row->date : $row['date'],
                'count' => is_object($row) ? $row->count : $row['count']
            ];
        }, $growth));
    }

    /**
     * Obtener top referidores
     */
    public function getTopReferrers(Request $request)
    {
        $user = $request->user();
        $limit = $request->get('limit', 10);

        if ($user->isSuperAdmin()) {
            // Top líderes globales
            $topReferrers = User::where('role', 'leader')
                ->orderBy('total_network_count', 'desc')
                ->limit($limit)
                ->select('id', 'nombre_completo', 'cedula', 'direct_referrals_count', 'total_network_count')
                ->get();
        } else {
            // Top de mi red
            $topReferrers = $user->getTopReferrers($limit);
        }

        return response()->json($topReferrers);
    }

    /**
     * Obtener referidos recientes
     */
    public function getRecentReferrals(Request $request)
    {
        $user = $request->user();
        $limit = $request->get('limit', 10);

        if ($user->isSuperAdmin()) {
            // Referidos recientes globales
            $recentReferrals = User::orderBy('created_at', 'desc')
                ->limit($limit)
                ->get();
        } else {
            // Referidos recientes de mi red
            $recentReferrals = User::whereRaw("path <@ ?", [$user->path])
                ->where('id', '!=', $user->id)
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get();
        }

        return response()->json($recentReferrals);
    }
}
