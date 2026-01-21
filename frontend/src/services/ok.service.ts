import api from './api';
import type { Ok, OkFormData, PaginatedResponse } from '../types';

export interface OkFilters {
  search?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export const okService = {
  /**
   * Listar OKs con paginación y filtros
   */
  async getOks(params?: OkFilters): Promise<PaginatedResponse<Ok>> {
    const response = await api.get<PaginatedResponse<Ok>>('/adn/oks', { params });
    return response.data;
  },

  /**
   * Obtener OKs activos (para selects)
   */
  async getActiveOks(): Promise<Ok[]> {
    const response = await api.get<Ok[]>('/adn/oks/active');
    return response.data;
  },

  /**
   * Obtener detalle de un OK
   */
  async getOk(id: number): Promise<Ok> {
    const response = await api.get<Ok>(`/adn/oks/${id}`);
    return response.data;
  },

  /**
   * Crear nuevo OK
   */
  async createOk(data: OkFormData): Promise<{ message: string; ok: Ok }> {
    const response = await api.post<{ message: string; ok: Ok }>('/adn/oks', data);
    return response.data;
  },

  /**
   * Actualizar OK
   */
  async updateOk(id: number, data: Partial<OkFormData & { is_active: boolean }>): Promise<{ message: string; ok: Ok }> {
    const response = await api.put<{ message: string; ok: Ok }>(`/adn/oks/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar OK
   */
  async deleteOk(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/adn/oks/${id}`);
    return response.data;
  },
};
