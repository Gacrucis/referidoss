import api from './api';
import type {
  User,
  PaginatedResponse,
  LeaderDashboard,
  LeaderHierarchyStats,
  NetworkStats,
  SubleaderFormData,
  HierarchyTreeNode,
} from '../types';

export const leaderHierarchyService = {
  /**
   * Obtener dashboard del líder actual
   */
  async getDashboard(): Promise<LeaderDashboard> {
    const response = await api.get<LeaderDashboard>('/leader-panel/dashboard');
    return response.data;
  },

  /**
   * Listar mis sub-líderes directos
   */
  async getSubleaders(params?: {
    search?: string;
    is_active?: boolean;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<User>> {
    const response = await api.get<PaginatedResponse<User>>('/leader-panel/subleaders', { params });
    return response.data;
  },

  /**
   * Crear un sub-líder
   */
  async createSubleader(data: SubleaderFormData): Promise<{ message: string; subleader: User }> {
    const response = await api.post<{ message: string; subleader: User }>('/leader-panel/subleaders', data);
    return response.data;
  },

  /**
   * Ver detalles de un sub-líder
   */
  async getSubleader(id: number): Promise<{
    subleader: User;
    hierarchy_stats: LeaderHierarchyStats;
    network_stats: NetworkStats;
  }> {
    const response = await api.get(`/leader-panel/subleaders/${id}`);
    return response.data;
  },

  /**
   * Activar/Desactivar un sub-líder
   */
  async toggleSubleaderActive(id: number): Promise<{ message: string; subleader: { id: number; is_active: boolean } }> {
    const response = await api.post(`/leader-panel/subleaders/${id}/toggle-active`);
    return response.data;
  },

  /**
   * Cambiar contraseña de un sub-líder
   */
  async changeSubleaderPassword(
    id: number,
    data: { password: string; password_confirmation: string }
  ): Promise<{ message: string }> {
    const response = await api.post(`/leader-panel/subleaders/${id}/change-password`, data);
    return response.data;
  },

  /**
   * Listar mis referidos directos (nietos)
   */
  async getMyReferrals(params?: {
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<User>> {
    const response = await api.get<PaginatedResponse<User>>('/leader-panel/my-referrals', { params });
    return response.data;
  },

  /**
   * Listar todos los miembros de la red (nietos acumulados)
   */
  async getAllNetworkMembers(params?: {
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<User>> {
    const response = await api.get<PaginatedResponse<User>>('/leader-panel/network-members', { params });
    return response.data;
  },

  /**
   * Obtener árbol jerárquico para visualización
   */
  async getHierarchyTree(maxDepth?: number): Promise<{
    tree: HierarchyTreeNode[];
    total_nodes: number;
  }> {
    const response = await api.get('/leader-panel/hierarchy-tree', {
      params: { max_depth: maxDepth },
    });
    return response.data;
  },
};
