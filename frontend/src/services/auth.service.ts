import api from './api';
import type { AuthResponse, AuthUser, LoginCredentials } from '../types';

export const authService = {
  /**
   * Login de usuario
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);

    // Guardar token y usuario en localStorage
    localStorage.setItem('auth_token', response.data.token);
    localStorage.setItem('auth_user', JSON.stringify(response.data.user));

    return response.data;
  },

  /**
   * Obtener usuario autenticado
   */
  async getMe(): Promise<{ user: AuthUser }> {
    const response = await api.get<{ user: AuthUser }>('/auth/me');

    // Actualizar usuario en localStorage
    localStorage.setItem('auth_user', JSON.stringify(response.data.user));

    return response.data;
  },

  /**
   * Cerrar sesión
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      // Limpiar localStorage incluso si la petición falla
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  },

  /**
   * Verificar si hay un usuario autenticado
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  /**
   * Obtener usuario del localStorage
   */
  getStoredUser(): AuthUser | null {
    const userStr = localStorage.getItem('auth_user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Actualizar perfil del usuario
   */
  async updateProfile(data: {
    nombre_completo?: string;
    email?: string;
    celular?: string;
    barrio?: string;
    departamento_votacion?: string;
    municipio_votacion?: string;
  }): Promise<{ message: string; user: AuthUser }> {
    const response = await api.put<{ message: string; user: AuthUser }>('/auth/profile', data);

    // Actualizar usuario en localStorage
    localStorage.setItem('auth_user', JSON.stringify(response.data.user));

    return response.data;
  },

  /**
   * Cambiar contraseña
   */
  async changePassword(data: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/change-password', data);
    return response.data;
  },
};
