<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class UserPolicy
{
    /**
     * Determinar si el usuario puede ver listado de usuarios
     * Todos los usuarios autenticados pueden ver la lista
     */
    public function viewAny(User $user): bool
    {
        return true; // Líderes y super admin pueden ver
    }

    /**
     * Determinar si el usuario puede ver un usuario específico
     * Puede ver si:
     * - Es super admin
     * - El usuario objetivo está en su red (es descendiente)
     * - Es él mismo
     */
    public function view(User $user, User $model): bool
    {
        // Super admin puede ver a cualquiera
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Puede verse a sí mismo
        if ($user->id === $model->id) {
            return true;
        }

        // Puede ver si está en su red (es descendiente)
        if ($user->isLeader() || $user->isMember()) {
            $descendants = $user->getAllDescendants()->pluck('id')->toArray();
            return in_array($model->id, $descendants);
        }

        return false;
    }

    /**
     * Determinar si el usuario puede crear referidos
     * Líderes y members pueden crear referidos
     */
    public function create(User $user): bool
    {
        // Super admin, líderes y members pueden crear referidos
        return $user->isSuperAdmin() || $user->isLeader() || $user->isMember();
    }

    /**
     * Determinar si el usuario puede actualizar un usuario
     * Puede actualizar si:
     * - Es super admin
     * - El usuario objetivo está en su red (es descendiente)
     * - Es él mismo
     */
    public function update(User $user, User $model): bool
    {
        // Super admin puede actualizar a cualquiera
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Puede actualizarse a sí mismo
        if ($user->id === $model->id) {
            return true;
        }

        // Puede actualizar si está en su red
        if ($user->isLeader() || $user->isMember()) {
            $descendants = $user->getAllDescendants()->pluck('id')->toArray();
            return in_array($model->id, $descendants);
        }

        return false;
    }

    /**
     * Determinar si el usuario puede eliminar un usuario
     * Solo super admin puede eliminar usuarios
     */
    public function delete(User $user, User $model): bool
    {
        return $user->isSuperAdmin();
    }

    /**
     * Determinar si el usuario puede restaurar un usuario eliminado
     * Solo super admin puede restaurar
     */
    public function restore(User $user, User $model): bool
    {
        return $user->isSuperAdmin();
    }

    /**
     * Determinar si el usuario puede eliminar permanentemente
     * Solo super admin puede eliminar permanentemente
     */
    public function forceDelete(User $user, User $model): bool
    {
        return $user->isSuperAdmin();
    }

    /**
     * Determinar si el usuario puede ver el árbol jerárquico
     * Todos los usuarios autenticados pueden ver su árbol
     */
    public function viewTree(User $user): bool
    {
        return true;
    }

    /**
     * Determinar si el usuario puede buscar en el árbol
     * Todos los usuarios autenticados pueden buscar
     */
    public function searchTree(User $user): bool
    {
        return true;
    }
}
