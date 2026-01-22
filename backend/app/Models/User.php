<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'email',
        'password',
        'role',
        'leader_type',
        'adn_type',
        'cedula',
        'nombre_completo',
        'primer_nombre',
        'segundo_nombre',
        'primer_apellido',
        'segundo_apellido',
        'celular',
        'barrio',
        'departamento_votacion',
        'municipio_votacion',
        'puesto_votacion',
        'direccion_votacion',
        'mesa_votacion',
        'observaciones',
        'referrer_id',
        'referral_code',
        'leader_referral_code',
        'leader_parent_id',
        'leader_path',
        'path',
        'level',
        'is_active',
        'direct_subleaders_count',
        'total_subleaders_count',
        'total_network_members_count',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
        'password' => 'hashed',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Boot function para generar código de referido automáticamente
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($user) {
            // Generar código de referido único (para nietos/miembros)
            if (empty($user->referral_code)) {
                $user->referral_code = self::generateReferralCode();
            }

            // Generar código para referir sub-líderes si es un líder jerárquico
            if (in_array($user->role, ['leader_papa', 'leader_hijo', 'leader_lnpro']) && empty($user->leader_referral_code)) {
                $user->leader_referral_code = self::generateLeaderReferralCode();
            }

            // Construir nombre_completo a partir de los nombres separados
            if ($user->primer_nombre || $user->primer_apellido) {
                $user->nombre_completo = trim(implode(' ', array_filter([
                    $user->primer_nombre,
                    $user->segundo_nombre,
                    $user->primer_apellido,
                    $user->segundo_apellido,
                ])));
            }

            // Establecer level basado en el referidor
            if ($user->referrer_id) {
                $referrer = User::find($user->referrer_id);
                $user->level = $referrer ? $referrer->level + 1 : 0;
            } else {
                $user->level = 0;
            }
        });

        static::updating(function ($user) {
            // Actualizar nombre_completo si alguno de los nombres cambia
            if ($user->isDirty(['primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido'])) {
                $user->nombre_completo = trim(implode(' ', array_filter([
                    $user->primer_nombre,
                    $user->segundo_nombre,
                    $user->primer_apellido,
                    $user->segundo_apellido,
                ])));
            }
        });

        static::created(function ($user) {
            // Construir path jerárquico DESPUÉS de tener el ID
            $user->updatePath();

            // Actualizar estadísticas del referidor
            $user->updateReferrerStats();

            // Actualizar path y estadísticas de la jerarquía de líderes
            if (in_array($user->role, ['leader_papa', 'leader_hijo', 'leader_lnpro'])) {
                $user->updateLeaderPath();
                $user->updateLeaderParentStats();
            }
        });

        static::deleting(function ($user) {
            // Al eliminar (soft delete), actualizar estadísticas del referidor
            if ($user->referrer_id) {
                $user->decrementReferrerStats();
            }
        });
    }

    /**
     * Relación: Usuario que refirió a este usuario
     */
    public function referrer()
    {
        return $this->belongsTo(User::class, 'referrer_id');
    }

    /**
     * Relación: Referidos directos de este usuario
     */
    public function directReferrals()
    {
        return $this->hasMany(User::class, 'referrer_id');
    }

    /**
     * Relación: Líder superior en la jerarquía (para leader_hijo y leader_lnpro)
     */
    public function leaderParent()
    {
        return $this->belongsTo(User::class, 'leader_parent_id');
    }

    /**
     * Relación: Sub-líderes directos (líderes que este líder creó)
     */
    public function directSubleaders()
    {
        return $this->hasMany(User::class, 'leader_parent_id');
    }

    /**
     * Generar código de referido único de 8 caracteres (para nietos/miembros)
     */
    public static function generateReferralCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (self::where('referral_code', $code)->exists());

        return $code;
    }

    /**
     * Generar código único para referir sub-líderes (10 caracteres con prefijo 'L')
     */
    public static function generateLeaderReferralCode(): string
    {
        do {
            $code = 'L' . strtoupper(Str::random(9));
        } while (self::where('leader_referral_code', $code)->exists());

        return $code;
    }

    /**
     * Construir path jerárquico usando ltree
     * Ejemplo: '1.5.23' significa que este usuario está en nivel 3
     */
    public function buildPath(): void
    {
        if ($this->referrer_id) {
            $referrer = User::find($this->referrer_id);
            if ($referrer) {
                // Path del padre + ID de este usuario
                $this->path = $referrer->path ? $referrer->path . '.' . $this->id : (string)$this->id;
                $this->level = $referrer->level + 1;
            } else {
                // No hay referidor, es un líder de primer nivel
                $this->path = (string)$this->id;
                $this->level = 0;
            }
        } else {
            // Sin referidor (líder principal o super admin)
            $this->path = (string)$this->id;
            $this->level = 0;
        }
    }

    /**
     * Actualizar path después de guardar (porque necesitamos el ID)
     */
    public function updatePath(): void
    {
        if ($this->referrer_id) {
            $referrer = User::find($this->referrer_id);
            if ($referrer) {
                $newPath = $referrer->path ? $referrer->path . '.' . $this->id : (string)$this->id;
                $this->update(['path' => $newPath, 'level' => $referrer->level + 1]);
            }
        } else {
            $this->update(['path' => (string)$this->id, 'level' => 0]);
        }
    }

    /**
     * Actualizar estadísticas del referidor (incrementar contadores)
     */
    public function updateReferrerStats(): void
    {
        if ($this->referrer_id) {
            // Incrementar contador de referidos directos del referidor
            DB::table('users')
                ->where('id', $this->referrer_id)
                ->increment('direct_referrals_count');

            // Contar cuántos usuarios se están agregando (este usuario + su red)
            $networkSize = $this->total_network_count + 1;

            // Incrementar total_network_count de todos los ancestros
            $ancestors = $this->getAncestors();
            foreach ($ancestors as $ancestor) {
                DB::table('users')
                    ->where('id', $ancestor->id)
                    ->increment('total_network_count', $networkSize);
            }
        }
    }

    /**
     * Decrementar estadísticas del referidor (al eliminar)
     */
    public function decrementReferrerStats(): void
    {
        if ($this->referrer_id) {
            DB::table('users')
                ->where('id', $this->referrer_id)
                ->decrement('direct_referrals_count');

            // Contar cuántos usuarios se están eliminando (este usuario + su red)
            $networkSize = $this->total_network_count + 1;

            $ancestors = $this->getAncestors();
            foreach ($ancestors as $ancestor) {
                DB::table('users')
                    ->where('id', $ancestor->id)
                    ->decrement('total_network_count', $networkSize);
            }
        }
    }

    /**
     * Obtener todos los descendientes (toda la red hacia abajo)
     * Usa operador <@ de ltree: "es descendiente de"
     */
    public function getAllDescendants()
    {
        if (!$this->path) {
            return collect([]);
        }

        return User::whereRaw("path <@ ?", [$this->path])
            ->where('id', '!=', $this->id)
            ->orderBy('path')
            ->get();
    }

    /**
     * Obtener todos los ancestros (path hacia arriba)
     * Usa operador @> de ltree: "es ancestro de"
     */
    public function getAncestors()
    {
        if (!$this->path) {
            return collect([]);
        }

        return User::whereRaw("path @> ?", [$this->path])
            ->where('id', '!=', $this->id)
            ->orderBy('level')
            ->get();
    }

    /**
     * Obtener árbol jerárquico para visualización D3.js
     * Con límite de profundidad para lazy loading
     */
    public function getTreeData(int $maxDepth = 5): array
    {
        $descendants = User::whereRaw("path <@ ?", [$this->path])
            ->where('level', '<=', $this->level + $maxDepth)
            ->orderBy('path')
            ->get();

        $tree = $this->buildTree($descendants);

        // Retornar el primer elemento (nodo raíz) en lugar del array completo
        return !empty($tree) ? $tree[0] : [];
    }

    /**
     * Construir estructura de árbol recursiva para D3.js
     */
    private function buildTree($users, $parentId = null)
    {
        $branch = [];

        foreach ($users as $user) {
            if ($user->referrer_id == $parentId || ($parentId === null && $user->id == $this->id)) {
                $children = $this->buildTree($users, $user->id);

                $node = [
                    'id' => $user->id,
                    'cedula' => $user->cedula,
                    'nombre_completo' => $user->nombre_completo,
                    'celular' => $user->celular,
                    'email' => $user->email,
                    'level' => $user->level,
                    'path' => $user->path,
                    'referrer_id' => $user->referrer_id,
                    'direct_referrals_count' => $user->direct_referrals_count,
                    'total_network_count' => $user->total_network_count,
                    'created_at' => $user->created_at->toISOString(),
                    'children' => $children
                ];

                $branch[] = $node;
            }
        }

        return $branch;
    }

    /**
     * Obtener estadísticas de la red del usuario
     */
    public function getNetworkStats(): array
    {
        $stats = DB::selectOne("
            SELECT
                COUNT(*) as total_network,
                COUNT(CASE WHEN referrer_id = ? THEN 1 END) as direct_referrals,
                MAX(level) - ? as max_depth,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_7_days,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as last_30_days
            FROM users
            WHERE path <@ ? AND id != ? AND deleted_at IS NULL
        ", [$this->id, $this->level, $this->path, $this->id]);

        return [
            'total_network' => $stats->total_network ?? 0,
            'direct_referrals' => $stats->direct_referrals ?? 0,
            'max_depth' => $stats->max_depth ?? 0,
            'last_7_days' => $stats->last_7_days ?? 0,
            'last_30_days' => $stats->last_30_days ?? 0,
        ];
    }

    /**
     * Obtener crecimiento por fecha (para gráficos)
     */
    public function getGrowthByDate(int $days = 30): array
    {
        // Validar que $days sea un entero positivo para evitar SQL injection
        $days = max(1, min((int)$days, 365));

        $results = DB::select("
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM users
            WHERE path <@ ?
            AND created_at >= NOW() - INTERVAL '" . $days . " days'
            AND deleted_at IS NULL
            GROUP BY DATE(created_at)
            ORDER BY date
        ", [$this->path]);

        return array_map(function($row) {
            return [
                'date' => $row->date,
                'count' => $row->count
            ];
        }, $results);
    }

    /**
     * Obtener top referidores de la red
     */
    public function getTopReferrers(int $limit = 10)
    {
        return User::whereRaw("path <@ ?", [$this->path])
            ->where('id', '!=', $this->id)
            ->where('deleted_at', null)
            ->orderBy('total_network_count', 'desc')
            ->limit($limit)
            ->select('id', 'nombre_completo', 'cedula', 'direct_referrals_count', 'total_network_count')
            ->get();
    }

    /**
     * Verificar si es super admin
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    /**
     * Verificar si es líder (cualquier tipo)
     */
    public function isLeader(): bool
    {
        return $this->role === 'leader' || $this->isHierarchicalLeader();
    }

    /**
     * Verificar si es líder jerárquico (papa, hijo, lnpro)
     */
    public function isHierarchicalLeader(): bool
    {
        return in_array($this->role, ['leader_papa', 'leader_hijo', 'leader_lnpro']);
    }

    /**
     * Verificar si es Líder Papá
     */
    public function isLeaderPapa(): bool
    {
        return $this->role === 'leader_papa';
    }

    /**
     * Verificar si es Líder Hijo Mayor
     */
    public function isLeaderHijo(): bool
    {
        return $this->role === 'leader_hijo';
    }

    /**
     * Verificar si es Líder LnPro
     */
    public function isLeaderLnpro(): bool
    {
        return $this->role === 'leader_lnpro';
    }

    /**
     * Verificar si es miembro/referido
     */
    public function isMember(): bool
    {
        return $this->role === 'member';
    }

    /**
     * Obtener el tipo de sub-líder que puede crear este líder
     */
    public function canCreateSubleaderType(): ?string
    {
        if ($this->role === 'leader_papa') {
            return 'leader_hijo';
        }
        if ($this->role === 'leader_hijo') {
            return 'leader_lnpro';
        }
        return null; // leader_lnpro no puede crear sub-líderes
    }

    /**
     * Verificar si puede crear sub-líderes
     */
    public function canCreateSubleaders(): bool
    {
        return $this->canCreateSubleaderType() !== null;
    }

    /**
     * Actualizar path de la jerarquía de líderes
     */
    public function updateLeaderPath(): void
    {
        if ($this->leader_parent_id) {
            $parent = User::find($this->leader_parent_id);
            if ($parent) {
                $newPath = $parent->leader_path ? $parent->leader_path . '.' . $this->id : (string)$this->id;
                $this->updateQuietly(['leader_path' => $newPath]);
            }
        } else {
            $this->updateQuietly(['leader_path' => (string)$this->id]);
        }
    }

    /**
     * Actualizar estadísticas del líder padre (incrementar contadores)
     */
    public function updateLeaderParentStats(): void
    {
        if ($this->leader_parent_id) {
            // Incrementar contador de sub-líderes directos del padre
            DB::table('users')
                ->where('id', $this->leader_parent_id)
                ->increment('direct_subleaders_count');

            // Incrementar total_subleaders_count de todos los ancestros en la jerarquía de líderes
            $ancestors = $this->getLeaderAncestors();
            foreach ($ancestors as $ancestor) {
                DB::table('users')
                    ->where('id', $ancestor->id)
                    ->increment('total_subleaders_count');
            }
        }
    }

    /**
     * Decrementar estadísticas del líder padre (al eliminar)
     */
    public function decrementLeaderParentStats(): void
    {
        if ($this->leader_parent_id) {
            DB::table('users')
                ->where('id', $this->leader_parent_id)
                ->decrement('direct_subleaders_count');

            $networkSize = $this->total_subleaders_count + 1;

            $ancestors = $this->getLeaderAncestors();
            foreach ($ancestors as $ancestor) {
                DB::table('users')
                    ->where('id', $ancestor->id)
                    ->decrement('total_subleaders_count', $networkSize);
            }
        }
    }

    /**
     * Obtener todos los ancestros en la jerarquía de líderes
     */
    public function getLeaderAncestors()
    {
        $ancestors = collect([]);
        $current = $this;

        while ($current->leader_parent_id) {
            $parent = User::find($current->leader_parent_id);
            if ($parent && in_array($parent->role, ['leader_papa', 'leader_hijo', 'leader_lnpro'])) {
                $ancestors->push($parent);
                $current = $parent;
            } else {
                break;
            }
        }

        return $ancestors;
    }

    /**
     * Obtener todos los sub-líderes (descendientes en la jerarquía)
     */
    public function getAllSubleaders()
    {
        $subleaders = collect([]);
        $queue = collect([$this->id]);

        while ($queue->isNotEmpty()) {
            $currentId = $queue->shift();
            $children = User::where('leader_parent_id', $currentId)
                ->whereIn('role', ['leader_papa', 'leader_hijo', 'leader_lnpro'])
                ->get();

            foreach ($children as $child) {
                $subleaders->push($child);
                $queue->push($child->id);
            }
        }

        return $subleaders;
    }

    /**
     * Obtener el Líder Papá raíz de esta jerarquía
     */
    public function getRootLeaderPapa()
    {
        if ($this->role === 'leader_papa') {
            return $this;
        }

        if (!$this->leader_path) {
            return null;
        }

        $rootId = explode('.', $this->leader_path)[0];
        return User::where('id', $rootId)
            ->where('role', 'leader_papa')
            ->first();
    }

    /**
     * Calcular total de miembros (nietos) acumulados en toda la red jerárquica
     */
    public function calculateTotalNetworkMembers(): int
    {
        // Mis propios referidos directos y su red
        $myMembers = $this->total_network_count;

        // Sumar los referidos de todos mis sub-líderes
        $subleaders = $this->getAllSubleaders();
        foreach ($subleaders as $subleader) {
            $myMembers += $subleader->total_network_count;
        }

        return $myMembers;
    }

    /**
     * Actualizar contador de miembros acumulados (llamar después de cambios en la red)
     */
    public function recalculateTotalNetworkMembers(): void
    {
        $total = $this->calculateTotalNetworkMembers();
        $this->updateQuietly(['total_network_members_count' => $total]);

        // Actualizar también a los ancestros
        $ancestors = $this->getLeaderAncestors();
        foreach ($ancestors as $ancestor) {
            $ancestorTotal = $ancestor->calculateTotalNetworkMembers();
            $ancestor->updateQuietly(['total_network_members_count' => $ancestorTotal]);
        }
    }

    /**
     * Obtener estadísticas de la jerarquía de líderes
     */
    public function getLeaderHierarchyStats(): array
    {
        $subleaders = $this->getAllSubleaders();

        $hijoCount = $subleaders->where('role', 'leader_hijo')->count();
        $lnproCount = $subleaders->where('role', 'leader_lnpro')->count();

        return [
            'direct_subleaders' => $this->direct_subleaders_count,
            'total_subleaders' => $this->total_subleaders_count,
            'hijos_mayores' => $hijoCount,
            'lnpros' => $lnproCount,
            'total_network_members' => $this->total_network_members_count,
            'my_direct_referrals' => $this->direct_referrals_count,
            'my_network' => $this->total_network_count,
        ];
    }

    /**
     * Relación: Líneas ADN a las que pertenece el usuario
     */
    public function lineas()
    {
        return $this->belongsToMany(Linea::class, 'linea_user')
                    ->withTimestamps();
    }

    /**
     * Relación: OKs ADN a los que pertenece el usuario
     */
    public function oks()
    {
        return $this->belongsToMany(Ok::class, 'ok_user')
                    ->withTimestamps();
    }

    /**
     * Verificar si puede asignar líneas (no tiene OKs)
     */
    public function canAssignLineas(): bool
    {
        return $this->oks()->count() === 0;
    }

    /**
     * Verificar si puede asignar OKs (no tiene líneas)
     */
    public function canAssignOks(): bool
    {
        return $this->lineas()->count() === 0;
    }

    /**
     * Obtener categorías ADN asignadas (líneas u OKs)
     */
    public function getAdnCategories()
    {
        if ($this->adn_type === 'linea') {
            return $this->lineas;
        } elseif ($this->adn_type === 'ok') {
            return $this->oks;
        }
        return collect([]);
    }
}
