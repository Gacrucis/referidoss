import api from './api';
import type { User, LeaderFormData, PaginatedResponse, LeaderStats } from '../types';

export const leaderService = {
  /**
   * Listar líderes
   */
  async getLeaders(params?: {
    search?: string;
    is_active?: boolean;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<User>> {
    const response = await api.get<PaginatedResponse<User>>('/leaders', { params });
    return response.data;
  },

  /**
   * Obtener un líder por ID
   */
  async getLeader(id: number): Promise<{ leader: User; network_stats: any }> {
    const response = await api.get<{ leader: User; network_stats: any }>(`/leaders/${id}`);
    return response.data;
  },

  /**
   * Crear nuevo líder
   */
  async createLeader(data: LeaderFormData): Promise<{ message: string; leader: User }> {
    const response = await api.post<{ message: string; leader: User }>('/leaders', data);
    return response.data;
  },

  /**
   * Actualizar líder
   */
  async updateLeader(
    id: number,
    data: Partial<LeaderFormData>
  ): Promise<{ message: string; leader: User }> {
    const response = await api.put<{ message: string; leader: User }>(`/leaders/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar líder
   */
  async deleteLeader(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/leaders/${id}`);
    return response.data;
  },

  /**
   * Activar/Desactivar líder
   */
  async toggleActive(id: number): Promise<{ message: string; leader: User }> {
    const response = await api.post<{ message: string; leader: User }>(
      `/leaders/${id}/toggle-active`
    );
    return response.data;
  },

  /**
   * Cambiar contraseña de líder
   */
  async changePassword(
    id: number,
    data: { password: string; password_confirmation: string }
  ): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(
      `/leaders/${id}/change-password`,
      data
    );
    return response.data;
  },

  /**
   * Obtener estadísticas de líderes
   */
  async getStats(): Promise<LeaderStats> {
    const response = await api.get<LeaderStats>('/leaders/stats');
    return response.data;
  },
};
