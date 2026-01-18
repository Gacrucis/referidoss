import api from './api';
import type { User, PaginatedResponse } from '../types';

export interface AdminUserFilters {
  search?: string;
  role?: 'super_admin' | 'leader' | 'member';
  is_active?: boolean;
  departamento?: string;
  municipio?: string;
  page?: number;
  per_page?: number;
  order_by?: string;
  order_direction?: 'asc' | 'desc';
}

export interface UserForSelect {
  id: number;
  nombre_completo: string;
  cedula: string;
  role: string;
  level: number;
}

export const adminService = {
  /**
   * Listar todos los usuarios (solo super admin)
   */
  async getUsers(filters?: AdminUserFilters): Promise<PaginatedResponse<User>> {
    const response = await api.get<PaginatedResponse<User>>('/admin/users', { params: filters });
    return response.data;
  },

  /**
   * Buscar usuarios para selector
   */
  async searchUsersForSelect(search: string, excludeId?: number): Promise<UserForSelect[]> {
    const response = await api.get<UserForSelect[]>('/admin/users/search', {
      params: { search, exclude_id: excludeId }
    });
    return response.data;
  },

  /**
   * Actualizar usuario (admin)
   */
  async updateUser(id: number, data: Partial<User>): Promise<{ message: string; user: User }> {
    const response = await api.put<{ message: string; user: User }>(`/admin/users/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar usuario
   */
  async deleteUser(id: number, deleteNetwork: boolean = false): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/admin/users/${id}`, {
      params: { delete_network: deleteNetwork }
    });
    return response.data;
  },

  /**
   * Mover usuario a otro referidor
   */
  async moveUser(id: number, newReferrerId: number): Promise<{ message: string; user: User }> {
    const response = await api.post<{ message: string; user: User }>(`/admin/users/${id}/move`, {
      new_referrer_id: newReferrerId
    });
    return response.data;
  },
};
