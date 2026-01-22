import api from './api';
import type { User, PaginatedResponse, LeaderPapaFormData, LeaderPapaStats, LeaderHierarchyStats, NetworkStats, Linea, Ok, AdnType } from '../types';

export interface LeaderHierarchyNode {
  id: number;
  nombre_completo: string;
  primer_nombre: string | null;
  segundo_nombre: string | null;
  primer_apellido: string | null;
  segundo_apellido: string | null;
  cedula: string;
  email: string | null;
  celular: string;
  barrio: string;
  departamento_votacion: string;
  municipio_votacion: string;
  puesto_votacion: string;
  direccion_votacion: string;
  mesa_votacion: string;
  observaciones: string | null;
  role: string;
  leader_type: string | null;
  referral_code: string;
  leader_referral_code: string | null;
  is_active: boolean;
  adn_type: AdnType;
  lineas: Linea[];
  oks: Ok[];
  direct_referrals_count: number;
  total_network_count: number;
  direct_subleaders_count: number;
  total_subleaders_count: number;
  total_network_members_count: number;
  created_at: string;
  children: LeaderHierarchyNode[];
}

export const leaderPapaService = {
  /**
   * Listar todos los Líderes Papá
   */
  async getLeaderPapas(params?: {
    search?: string;
    is_active?: boolean;
    page?: number;
    per_page?: number;
    order_by?: string;
    order_direction?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<User>> {
    const response = await api.get<PaginatedResponse<User>>('/leader-papas', { params });
    return response.data;
  },

  /**
   * Obtener un Líder Papá por ID
   */
  async getLeaderPapa(id: number): Promise<{
    leader: User;
    hierarchy_stats: LeaderHierarchyStats;
    network_stats: NetworkStats;
  }> {
    const response = await api.get(`/leader-papas/${id}`);
    return response.data;
  },

  /**
   * Crear nuevo Líder Papá
   */
  async createLeaderPapa(data: LeaderPapaFormData): Promise<{ message: string; leader: User }> {
    const response = await api.post<{ message: string; leader: User }>('/leader-papas', data);
    return response.data;
  },

  /**
   * Actualizar Líder Papá
   */
  async updateLeaderPapa(
    id: number,
    data: Partial<LeaderPapaFormData>
  ): Promise<{ message: string; leader: User }> {
    const response = await api.put<{ message: string; leader: User }>(`/leader-papas/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar Líder Papá
   */
  async deleteLeaderPapa(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/leader-papas/${id}`);
    return response.data;
  },

  /**
   * Activar/Desactivar Líder Papá
   */
  async toggleActive(id: number): Promise<{ message: string; leader: { id: number; is_active: boolean } }> {
    const response = await api.post(`/leader-papas/${id}/toggle-active`);
    return response.data;
  },

  /**
   * Cambiar contraseña de Líder Papá
   */
  async changePassword(
    id: number,
    data: { password: string; password_confirmation: string }
  ): Promise<{ message: string }> {
    const response = await api.post(`/leader-papas/${id}/change-password`, data);
    return response.data;
  },

  /**
   * Obtener estadísticas de Líderes Papá
   */
  async getStats(): Promise<LeaderPapaStats> {
    const response = await api.get<LeaderPapaStats>('/leader-papas/stats');
    return response.data;
  },

  /**
   * Obtener la jerarquía completa de todos los líderes
   */
  async getFullHierarchy(): Promise<{
    hierarchy: LeaderHierarchyNode[];
    stats: {
      total_papas: number;
      total_hijos: number;
      total_lnpros: number;
      total_leaders: number;
    };
  }> {
    const response = await api.get('/leader-papas/hierarchy');
    return response.data;
  },
};
