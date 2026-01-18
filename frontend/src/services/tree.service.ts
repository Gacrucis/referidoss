import apiClient from './api';
import type { User } from '../types';

export interface TreeNode {
  id: number;
  cedula: string;
  nombre_completo: string;
  celular: string;
  email: string;
  level: number;
  path: string;
  referrer_id: number | null;
  direct_referrals_count: number;
  total_network_count: number;
  created_at: string;
  children?: TreeNode[];
  _children?: TreeNode[]; // Hidden children for D3.js
}

export interface TreeData {
  tree: TreeNode;
  stats: {
    total_nodes: number;
    max_depth: number;
    total_leaders: number;
  };
}

export interface TreeSearchParams {
  search?: string;
  type?: 'cedula' | 'nombre' | 'email';
}

export const treeService = {
  /**
   * Obtiene el árbol jerárquico completo o de un usuario específico
   */
  async getTree(userId?: number): Promise<TreeData> {
    const endpoint = userId ? `/tree?user_id=${userId}` : '/tree';
    const { data } = await apiClient.get(endpoint);
    return data;
  },

  /**
   * Obtiene los descendientes de un nodo específico (para lazy loading)
   */
  async getDescendants(userId: number, maxDepth?: number): Promise<TreeNode[]> {
    const endpoint = `/tree/descendants/${userId}${maxDepth ? `?max_depth=${maxDepth}` : ''}`;
    const { data } = await apiClient.get(endpoint);
    return data;
  },

  /**
   * Busca nodos en el árbol
   */
  async searchTree(params: TreeSearchParams): Promise<User[]> {
    const { data } = await apiClient.get('/tree/search', { params });
    return data;
  },

  /**
   * Obtiene la ruta de ancestros de un nodo hasta la raíz
   */
  async getAncestors(userId: number): Promise<User[]> {
    const { data } = await apiClient.get(`/tree/ancestors/${userId}`);
    return data;
  },
};
