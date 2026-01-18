import api from './api';
import type { DashboardStats, GrowthDataPoint, TopReferrer, User } from '../types';

export const dashboardService = {
  /**
   * Obtener estadísticas del dashboard según rol
   */
  async getStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },

  /**
   * Obtener datos de crecimiento para gráficos
   */
  async getGrowth(days: number = 30): Promise<GrowthDataPoint[]> {
    const response = await api.get<GrowthDataPoint[]>('/dashboard/growth', {
      params: { days },
    });
    return response.data;
  },

  /**
   * Obtener top referidores
   */
  async getTopReferrers(limit: number = 10): Promise<TopReferrer[]> {
    const response = await api.get<TopReferrer[]>('/dashboard/top-referrers', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Obtener referidos recientes
   */
  async getRecentReferrals(limit: number = 10): Promise<User[]> {
    const response = await api.get<User[]>('/dashboard/recent', {
      params: { limit },
    });
    return response.data;
  },
};
