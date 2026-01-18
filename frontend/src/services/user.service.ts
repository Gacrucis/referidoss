import api from './api';
import type { User, ReferralFormData, PaginatedResponse } from '../types';

export const userService = {
  /**
   * Listar usuarios con filtros y paginación
   */
  async getUsers(params?: {
    search?: string;
    departamento?: string;
    municipio?: string;
    referrer_id?: number;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<User>> {
    const response = await api.get<PaginatedResponse<User>>('/users', { params });
    return response.data;
  },

  /**
   * Obtener un usuario por ID
   */
  async getUser(id: number): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  /**
   * Crear nuevo referido
   */
  async createUser(data: ReferralFormData): Promise<{ message: string; user: User }> {
    const response = await api.post<{ message: string; user: User }>('/users', data);
    return response.data;
  },

  /**
   * Actualizar usuario
   */
  async updateUser(
    id: number,
    data: Partial<ReferralFormData>
  ): Promise<{ message: string; user: User }> {
    const response = await api.put<{ message: string; user: User }>(`/users/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar usuario
   */
  async deleteUser(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/users/${id}`);
    return response.data;
  },

  /**
   * Exportar usuarios a Excel
   */
  async exportToExcel(filters?: any): Promise<void> {
    const response = await api.get('/users/export/excel', {
      params: filters,
      responseType: 'blob',
    });

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
