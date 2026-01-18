<?php

namespace App\Policies;

use App\Models\User;

class LeaderPolicy
{
    /**
     * Determinar si el usuario puede ver listado de líderes
     * Solo super admin puede ver todos los líderes
     */
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin();
    }

    /**
     * Determinar si el usuario puede ver un líder específico
     * Solo super admin puede ver detalles de líderes
     */
    public function view(User $user, User $leader): bool
    {
        return $user->isSuperAdmin();
    }

    /**
     * Determinar si el usuario puede crear líderes
     * Solo super admin puede crear líderes
     */
    public function create(User $user): bool
    {
        return $user->isSuperAdmin();
    }

    /**
     * Determinar si el usuario puede actualizar un líder
     * Solo super admin puede actualizar líderes
     */
    public function update(User $user, User $leader): bool
    {
        return $user->isSuperAdmin();
    }

    /**
     * Determinar si el usuario puede eliminar un líder
     * Solo super admin puede eliminar líderes
     */
    public function delete(User $user, User $leader): bool
    {
        return $user->isSuperAdmin();
    }

    /**
     * Determinar si el usuario puede activar/desactivar líderes
     * Solo super admin puede activar/desactivar
     */
    public function toggleActive(User $user, User $leader): bool
    {
        return $user->isSuperAdmin();
    }

    /**
     * Determinar si el usuario puede ver estadísticas de líderes
     * Solo super admin puede ver estadísticas globales de líderes
     */
    public function viewStats(User $user): bool
    {
        return $user->isSuperAdmin();
    }
}
