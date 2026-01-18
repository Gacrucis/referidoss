<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login de usuario (solo líderes y super admin)
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        // Verificar que el usuario existe y tiene rol de líder o super admin
        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales son incorrectas.'],
            ]);
        }

        // Solo líderes y super admin pueden hacer login
        if ($user->role === 'member') {
            throw ValidationException::withMessages([
                'email' => ['Solo líderes y administradores pueden acceder al sistema.'],
            ]);
        }

        // Crear token de Sanctum
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'nombre_completo' => $user->nombre_completo,
                'email' => $user->email,
                'role' => $user->role,
                'cedula' => $user->cedula,
                'celular' => $user->celular,
                'referral_code' => $user->referral_code,
                'level' => $user->level,
                'direct_referrals_count' => $user->direct_referrals_count,
                'total_network_count' => $user->total_network_count,
            ],
            'token' => $token,
        ]);
    }

    /**
     * Obtener información del usuario autenticado
     */
    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'nombre_completo' => $user->nombre_completo,
                'email' => $user->email,
                'role' => $user->role,
                'cedula' => $user->cedula,
                'celular' => $user->celular,
                'referral_code' => $user->referral_code,
                'level' => $user->level,
                'direct_referrals_count' => $user->direct_referrals_count,
                'total_network_count' => $user->total_network_count,
            ],
        ]);
    }

    /**
     * Logout del usuario
     */
    public function logout(Request $request)
    {
        // Eliminar el token actual
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada exitosamente',
        ]);
    }

    /**
     * Actualizar perfil del usuario autenticado
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'nombre_completo' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'celular' => 'sometimes|string|max:20',
            'barrio' => 'sometimes|string|max:255',
            'departamento_votacion' => 'sometimes|string|max:255',
            'municipio_votacion' => 'sometimes|string|max:255',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Perfil actualizado exitosamente',
            'user' => [
                'id' => $user->id,
                'nombre_completo' => $user->nombre_completo,
                'email' => $user->email,
                'role' => $user->role,
                'cedula' => $user->cedula,
                'celular' => $user->celular,
                'barrio' => $user->barrio,
                'departamento_votacion' => $user->departamento_votacion,
                'municipio_votacion' => $user->municipio_votacion,
                'referral_code' => $user->referral_code,
                'level' => $user->level,
                'direct_referrals_count' => $user->direct_referrals_count,
                'total_network_count' => $user->total_network_count,
            ],
        ]);
    }

    /**
     * Cambiar contraseña del usuario autenticado
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        // Verificar contraseña actual
        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['La contraseña actual es incorrecta.'],
            ]);
        }

        // Actualizar contraseña
        $user->update([
            'password' => Hash::make($validated['new_password']),
        ]);

        return response()->json([
            'message' => 'Contraseña actualizada exitosamente',
        ]);
    }
}
