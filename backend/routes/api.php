<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\LeaderController;
use App\Http\Controllers\Api\TreeController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Sistema de referidos multinivel con autenticación Laravel Sanctum
|
*/

// ============================================
// Rutas públicas (sin autenticación)
// ============================================
Route::post('/auth/login', [AuthController::class, 'login']);

// Registro público con código de referido
Route::get('/public/referrer/{code}', [UserController::class, 'getReferrerByCode']);
Route::post('/public/register', [UserController::class, 'publicRegister']);

// ============================================
// Rutas protegidas (requieren autenticación)
// ============================================
Route::middleware('auth:sanctum')->group(function () {

    // ============================================
    // Autenticación y Perfil
    // ============================================
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });

    // ============================================
    // Dashboard (Estadísticas según rol)
    // ============================================
    Route::prefix('dashboard')->group(function () {
        Route::get('/stats', [DashboardController::class, 'getStats']);
        Route::get('/growth', [DashboardController::class, 'getGrowthData']);
        Route::get('/top-referrers', [DashboardController::class, 'getTopReferrers']);
        Route::get('/recent', [DashboardController::class, 'getRecentReferrals']);
    });

    // ============================================
    // Usuarios/Referidos (CRUD)
    // ============================================
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);           // Listar con filtros
        Route::post('/', [UserController::class, 'store']);          // Crear referido
        Route::get('/export/excel', [UserController::class, 'exportToExcel']); // Exportar a Excel
        Route::get('/{id}', [UserController::class, 'show']);        // Ver detalle
        Route::put('/{id}', [UserController::class, 'update']);      // Actualizar
        Route::delete('/{id}', [UserController::class, 'destroy']);  // Eliminar (solo super admin)
    });

    // ============================================
    // Árbol Jerárquico (Visualización D3.js)
    // ============================================
    Route::prefix('tree')->group(function () {
        Route::get('/', [TreeController::class, 'getTree']);                      // Árbol completo
        Route::get('/stats', [TreeController::class, 'getTreeStats']);            // Estadísticas del árbol
        Route::get('/search', [TreeController::class, 'search']);                 // Buscar en árbol
        Route::get('/descendants/{userId}', [TreeController::class, 'getDescendants']); // Hijos de un nodo
    });

    // ============================================
    // Gestión de Líderes (Solo Super Admin)
    // ============================================
    Route::prefix('leaders')->group(function () {
        Route::get('/', [LeaderController::class, 'index']);           // Listar líderes
        Route::post('/', [LeaderController::class, 'store']);          // Crear líder
        Route::get('/stats', [LeaderController::class, 'stats']);      // Estadísticas de líderes
        Route::get('/{id}', [LeaderController::class, 'show']);        // Ver detalle
        Route::put('/{id}', [LeaderController::class, 'update']);      // Actualizar líder
        Route::delete('/{id}', [LeaderController::class, 'destroy']);  // Eliminar líder
        Route::post('/{id}/toggle-active', [LeaderController::class, 'toggleActive']); // Activar/Desactivar
        Route::post('/{id}/change-password', [LeaderController::class, 'changePassword']); // Cambiar contraseña
    });

    // ============================================
    // Gestión de TODOS los Usuarios (Solo Super Admin)
    // ============================================
    Route::prefix('admin/users')->group(function () {
        Route::get('/', [UserController::class, 'adminIndex']);              // Listar todos los usuarios
        Route::get('/search', [UserController::class, 'searchForSelect']);   // Buscar para selector
        Route::put('/{id}', [UserController::class, 'adminUpdate']);         // Actualizar completo
        Route::delete('/{id}', [UserController::class, 'adminDestroy']);     // Eliminar con opciones
        Route::post('/{id}/move', [UserController::class, 'moveUser']);      // Mover a otro referidor
    });
});
