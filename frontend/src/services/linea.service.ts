import api from './api';
import type { Linea, LineaFormData, PaginatedResponse } from '../types';

export interface LineaFilters {
  search?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export const lineaService = {
  /**
   * Listar líneas con paginación y filtros
   */
  async getLineas(params?: LineaFilters): Promise<PaginatedResponse<Linea>> {
    const response = await api.get<PaginatedResponse<Linea>>('/adn/lineas', { params });
    return response.data;
  },

  /**
   * Obtener líneas activas (para selects)
   */
  async getActiveLineas(): Promise<Linea[]> {
    const response = await api.get<Linea[]>('/adn/lineas/active');
    return response.data;
  },

  /**
   * Obtener detalle de una línea
   */
  async getLinea(id: number): Promise<Linea> {
    const response = await api.get<Linea>(`/adn/lineas/${id}`);
    return response.data;
  },

  /**
   * Crear nueva línea
   */
  async createLinea(data: LineaFormData): Promise<{ message: string; linea: Linea }> {
    const response = await api.post<{ message: string; linea: Linea }>('/adn/lineas', data);
    return response.data;
  },

  /**
   * Actualizar línea
   */
  async updateLinea(id: number, data: Partial<LineaFormData & { is_active: boolean }>): Promise<{ message: string; linea: Linea }> {
    const response = await api.put<{ message: string; linea: Linea }>(`/adn/lineas/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar línea
   */
  async deleteLinea(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/adn/lineas/${id}`);
    return response.data;
  },
};
