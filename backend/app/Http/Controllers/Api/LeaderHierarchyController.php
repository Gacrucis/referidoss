<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class LeaderHierarchyController extends Controller
{
    /**
     * Obtener información del líder por código de referido (para registro público)
     */
    public function getLeaderByCode($code)
    {
        $leader = User::where('leader_referral_code', $code)
            ->whereIn('role', ['leader_papa', 'leader_hijo'])
            ->where('is_active', true)
            ->first();

        if (!$leader) {
            return response()->json(['error' => 'Código de líder no válido o inactivo'], 404);
        }

        if (!$leader->canCreateSubleaders()) {
            return response()->json(['error' => 'Este líder no puede crear sub-líderes'], 422);
        }

        $subleaderType = $leader->canCreateSubleaderType();
        $subleaderLabel = $subleaderType === 'leader_hijo' ? 'Líder Hijo Mayor' : 'Líder LnPro';

        return response()->json([
            'leader' => [
                'id' => $leader->id,
                'nombre_completo' => $leader->nombre_completo,
                'role' => $leader->role,
                'adn_type' => $leader->adn_type,
            ],
            'subleader_type' => $subleaderType,
            'subleader_label' => $subleaderLabel,
        ]);
    }

    /**
     * Obtener información del panel del líder actual
     */
    public function dashboard(Request $request)
    {
        $user = $request->user();

        if (!$user->isHierarchicalLeader()) {
            return response()->json(['error' => 'No autorizado. Debe ser un líder jerárquico.'], 403);
        }

        $user->load(['lineas:id,nombre,color', 'oks:id,nombre,color', 'leaderParent:id,nombre_completo']);

        return response()->json([
            'leader' => [
                'id' => $user->id,
                'nombre_completo' => $user->nombre_completo,
                'cedula' => $user->cedula,
                'email' => $user->email,
                'celular' => $user->celular,
                'role' => $user->role,
                'leader_type' => $user->leader_type,
                'referral_code' => $user->referral_code, // Para nietos
                'leader_referral_code' => $user->leader_referral_code, // Para sub-líderes
                'adn_type' => $user->adn_type,
                'lineas' => $user->lineas,
                'oks' => $user->oks,
                'leader_parent' => $user->leaderParent,
            ],
            'stats' => $user->getLeaderHierarchyStats(),
            'network_stats' => $user->getNetworkStats(),
            'can_create_subleaders' => $user->canCreateSubleaders(),
            'subleader_type' => $user->canCreateSubleaderType(),
        ]);
    }

    /**
     * Listar sub-líderes directos del líder actual
     */
    public function listSubleaders(Request $request)
    {
        $user = $request->user();

        if (!$user->isHierarchicalLeader()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $query = User::where('leader_parent_id', $user->id);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('cedula', 'like', "%{$search}%")
                  ->orWhere('nombre_completo', 'like', "%{$search}%")
                  ->orWhere('celular', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $query->with(['lineas:id,nombre,color', 'oks:id,nombre,color']);
        $query->orderBy('created_at', 'desc');

        $subleaders = $query->paginate($request->get('per_page', 15));

        $subleaders->getCollection()->transform(function($subleader) {
            return [
                'id' => $subleader->id,
                'nombre_completo' => $subleader->nombre_completo,
                'cedula' => $subleader->cedula,
                'celular' => $subleader->celular,
                'email' => $subleader->email,
                'role' => $subleader->role,
                'is_active' => $subleader->is_active,
                'adn_type' => $subleader->adn_type,
                'lineas' => $subleader->lineas,
                'oks' => $subleader->oks,
                'direct_referrals_count' => $subleader->direct_referrals_count,
                'total_network_count' => $subleader->total_network_count,
                'direct_subleaders_count' => $subleader->direct_subleaders_count,
                'total_subleaders_count' => $subleader->total_subleaders_count,
                'created_at' => $subleader->created_at->toISOString(),
            ];
        });

        return response()->json($subleaders);
    }

    /**
     * Crear un sub-líder (Hijo Mayor o LnPro)
     */
    public function createSubleader(Request $request)
    {
        $user = $request->user();

        if (!$user->canCreateSubleaders()) {
            return response()->json([
                'error' => 'No tiene permisos para crear sub-líderes'
            ], 403);
        }

        $subleaderRole = $user->canCreateSubleaderType();

        $validated = $request->validate([
            'cedula' => 'required|string|unique:users,cedula',
            'primer_nombre' => 'required|string|max:100',
            'segundo_nombre' => 'nullable|string|max:100',
            'primer_apellido' => 'required|string|max:100',
            'segundo_apellido' => 'nullable|string|max:100',
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
        ]);

        return DB::transaction(function () use ($validated, $user, $subleaderRole) {
            // El sub-líder hereda el ADN del líder padre
            $validated['role'] = $subleaderRole;
            $validated['leader_type'] = str_replace('leader_', '', $subleaderRole);
            $validated['is_active'] = true;
            $validated['leader_parent_id'] = $user->id;
            $validated['adn_type'] = $user->adn_type;

            $subleader = User::create($validated);

            // Heredar las líneas u OKs del padre
            if ($user->adn_type === 'linea') {
                $subleader->lineas()->sync($user->lineas->pluck('id'));
            } elseif ($user->adn_type === 'ok') {
                $subleader->oks()->sync($user->oks->pluck('id'));
            }

            $subleader->load(['lineas:id,nombre,color', 'oks:id,nombre,color']);

            return response()->json([
                'message' => 'Sub-líder creado exitosamente',
                'subleader' => $subleader
            ], 201);
        });
    }

    /**
     * Ver detalles de un sub-líder específico
     */
    public function showSubleader(Request $request, $id)
    {
        $user = $request->user();

        if (!$user->isHierarchicalLeader()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        // Verificar que el sub-líder pertenece a la jerarquía de este líder
        $subleader = User::find($id);

        if (!$subleader) {
            return response()->json(['error' => 'Sub-líder no encontrado'], 404);
        }

        // Verificar que está en la jerarquía siguiendo leader_parent_id
        $isInHierarchy = false;
        $current = $subleader;
        while ($current->leader_parent_id) {
            if ($current->leader_parent_id == $user->id) {
                $isInHierarchy = true;
                break;
            }
            $current = User::find($current->leader_parent_id);
            if (!$current) break;
        }

        if (!$isInHierarchy && $subleader->id != $user->id) {
            return response()->json(['error' => 'Sub-líder no encontrado en su jerarquía'], 404);
        }

        $subleader->load([
            'lineas:id,nombre,color',
            'oks:id,nombre,color',
            'leaderParent:id,nombre_completo',
            'directSubleaders:id,nombre_completo,cedula,role,is_active'
        ]);

        return response()->json([
            'subleader' => $subleader,
            'hierarchy_stats' => $subleader->getLeaderHierarchyStats(),
            'network_stats' => $subleader->getNetworkStats(),
        ]);
    }

    /**
     * Listar mis referidos (nietos/miembros)
     */
    public function listMyReferrals(Request $request)
    {
        $user = $request->user();

        if (!$user->isHierarchicalLeader()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $query = User::where('referrer_id', $user->id)
            ->where('role', 'member');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('cedula', 'like', "%{$search}%")
                  ->orWhere('nombre_completo', 'like', "%{$search}%")
                  ->orWhere('celular', 'like', "%{$search}%");
            });
        }

        $query->orderBy('created_at', 'desc');

        $referrals = $query->paginate($request->get('per_page', 15));

        return response()->json($referrals);
    }

    /**
     * Ver toda la red de miembros (nietos) acumulada
     */
    public function listAllNetworkMembers(Request $request)
    {
        $user = $request->user();

        if (!$user->isHierarchicalLeader()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        // Obtener IDs de todos los líderes en mi jerarquía (incluyéndome)
        $leaderIds = collect([$user->id]);

        // Obtener sub-líderes recursivamente
        $subleaders = $user->getAllSubleaders();
        $leaderIds = $leaderIds->merge($subleaders->pluck('id'));

        // Buscar todos los miembros referidos por cualquier líder de la jerarquía
        $query = User::whereIn('referrer_id', $leaderIds)
            ->where('role', 'member');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('cedula', 'like', "%{$search}%")
                  ->orWhere('nombre_completo', 'like', "%{$search}%")
                  ->orWhere('celular', 'like', "%{$search}%");
            });
        }

        $query->with(['referrer:id,nombre_completo,role']);
        $query->orderBy('created_at', 'desc');

        $members = $query->paginate($request->get('per_page', 15));

        return response()->json($members);
    }

    /**
     * Activar/Desactivar un sub-líder
     */
    public function toggleSubleaderActive(Request $request, $id)
    {
        $user = $request->user();

        if (!$user->isHierarchicalLeader()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        // Solo puede toggle sub-líderes directos
        $subleader = User::where('id', $id)
            ->where('leader_parent_id', $user->id)
            ->first();

        if (!$subleader) {
            return response()->json(['error' => 'Sub-líder no encontrado'], 404);
        }

        $subleader->is_active = !$subleader->is_active;
        $subleader->save();

        return response()->json([
            'message' => $subleader->is_active ? 'Sub-líder activado' : 'Sub-líder desactivado',
            'subleader' => ['id' => $subleader->id, 'is_active' => $subleader->is_active]
        ]);
    }

    /**
     * Cambiar contraseña de un sub-líder
     */
    public function changeSubleaderPassword(Request $request, $id)
    {
        $user = $request->user();

        if (!$user->isHierarchicalLeader()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $subleader = User::where('id', $id)
            ->where('leader_parent_id', $user->id)
            ->first();

        if (!$subleader) {
            return response()->json(['error' => 'Sub-líder no encontrado'], 404);
        }

        $validated = $request->validate([
            'password' => 'required|string|min:6|confirmed'
        ]);

        $subleader->password = $validated['password'];
        $subleader->save();

        return response()->json(['message' => 'Contraseña actualizada exitosamente']);
    }

    /**
     * Obtener árbol jerárquico completo para visualización
     */
    public function getHierarchyTree(Request $request)
    {
        $user = $request->user();

        if (!$user->isHierarchicalLeader()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $maxDepth = $request->get('max_depth', 5);

        // Obtener todos los nodos de la jerarquía (usuario actual + sub-líderes)
        $subleaders = $user->getAllSubleaders();
        $nodes = collect([$user])->merge($subleaders);
        $nodes->load(['lineas:id,nombre,color', 'oks:id,nombre,color']);

        $tree = $this->buildHierarchyTree($nodes, $user->id);

        return response()->json([
            'tree' => $tree,
            'total_nodes' => $nodes->count(),
        ]);
    }

    /**
     * Construir árbol jerárquico recursivo
     */
    private function buildHierarchyTree($nodes, $parentId = null)
    {
        $branch = [];

        foreach ($nodes as $node) {
            if ($node->leader_parent_id == $parentId || ($parentId !== null && $node->id == $parentId && !$node->leader_parent_id)) {
                $children = $this->buildHierarchyTree($nodes, $node->id);

                $branch[] = [
                    'id' => $node->id,
                    'nombre_completo' => $node->nombre_completo,
                    'cedula' => $node->cedula,
                    'role' => $node->role,
                    'is_active' => $node->is_active,
                    'direct_referrals_count' => $node->direct_referrals_count,
                    'total_network_count' => $node->total_network_count,
                    'direct_subleaders_count' => $node->direct_subleaders_count,
                    'adn_type' => $node->adn_type,
                    'lineas' => $node->lineas,
                    'oks' => $node->oks,
                    'children' => $children,
                ];
            }
        }

        return $branch;
    }

    /**
     * Registrar un sub-líder usando código de referido de líder
     */
    public function registerByLeaderCode(Request $request)
    {
        $validated = $request->validate([
            'leader_code' => 'required|string|exists:users,leader_referral_code',
            'cedula' => 'required|string|unique:users,cedula',
            'primer_nombre' => 'required|string|max:100',
            'segundo_nombre' => 'nullable|string|max:100',
            'primer_apellido' => 'required|string|max:100',
            'segundo_apellido' => 'nullable|string|max:100',
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
        ]);

        $parent = User::where('leader_referral_code', $validated['leader_code'])->first();

        if (!$parent->canCreateSubleaders()) {
            return response()->json([
                'error' => 'Este líder no puede crear sub-líderes'
            ], 422);
        }

        if (!$parent->is_active) {
            return response()->json([
                'error' => 'El líder referidor no está activo'
            ], 422);
        }

        $subleaderRole = $parent->canCreateSubleaderType();

        return DB::transaction(function () use ($validated, $parent, $subleaderRole) {
            unset($validated['leader_code']);

            $validated['role'] = $subleaderRole;
            $validated['leader_type'] = str_replace('leader_', '', $subleaderRole);
            $validated['is_active'] = true;
            $validated['leader_parent_id'] = $parent->id;
            $validated['adn_type'] = $parent->adn_type;

            $subleader = User::create($validated);

            // Heredar ADN del padre
            if ($parent->adn_type === 'linea') {
                $subleader->lineas()->sync($parent->lineas->pluck('id'));
            } elseif ($parent->adn_type === 'ok') {
                $subleader->oks()->sync($parent->oks->pluck('id'));
            }

            return response()->json([
                'message' => 'Registro exitoso como ' . ($subleaderRole === 'leader_hijo' ? 'Líder Hijo Mayor' : 'Líder LnPro'),
                'user' => $subleader
            ], 201);
        });
    }
}
