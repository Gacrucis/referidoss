// ============================================
// Tipos de Usuario y Roles
// ============================================
export type UserRole = 'super_admin' | 'leader' | 'member';

export interface User {
  id: number;
  email: string | null;
  role: UserRole;
  cedula: string;
  nombre_completo: string;
  celular: string;
  barrio: string;
  departamento_votacion: string;
  municipio_votacion: string;
  puesto_votacion: string;
  direccion_votacion: string;
  mesa_votacion: string;
  observaciones: string | null;
  referrer_id: number | null;
  referral_code: string;
  path: string;
  level: number;
  is_active: boolean;
  direct_referrals_count: number;
  total_network_count: number;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: number;
  nombre_completo: string;
  email: string;
  role: UserRole;
  cedula: string;
  celular: string;
  referral_code: string;
  level: number;
  direct_referrals_count: number;
  total_network_count: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

// ============================================
// Formulario de Referido
// ============================================
export interface ReferralFormData {
  cedula: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  celular: string;
  barrio: string;
  departamento_votacion: string;
  municipio_votacion: string;
  puesto_votacion: string;
  direccion_votacion: string;
  mesa_votacion: string;
  observaciones?: string;
}

// ============================================
// Filtros de Búsqueda
// ============================================
export interface SearchFilters {
  cedula?: string;
  nombre?: string;
  celular?: string;
  departamento?: string;
  municipio?: string;
  barrio?: string;
}

// ============================================
// Estadísticas y Dashboard
// ============================================
export interface NetworkStats {
  total_network: number;
  direct_referrals: number;
  max_depth: number;
  last_7_days: number;
  last_30_days: number;
}

export interface DashboardStats {
  total_users?: number;
  total_leaders?: number;
  total_members?: number;
  direct_referrals?: number;
  total_network?: number;
  growth_last_30_days?: number;
  max_depth?: number;
  last_7_days?: number;
  last_30_days?: number;
}

export interface GrowthDataPoint {
  date: string;
  count: number;
}

export interface TopReferrer {
  id: number;
  nombre_completo: string;
  cedula: string;
  direct_referrals_count: number;
  total_network_count: number;
}

// ============================================
// Árbol Jerárquico (D3.js)
// ============================================
export interface TreeNode {
  id: number;
  name: string;
  cedula: string;
  referral_code: string;
  direct_referrals: number;
  total_network: number;
  level: number;
  children: TreeNode[];
}

// ============================================
// Paginación
// ============================================
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

// ============================================
// Departamentos y Municipios
// ============================================
export interface Departamento {
  codigo: string;
  nombre: string;
}

export interface Municipio {
  codigo: string;
  nombre: string;
  departamento_codigo: string;
}

// ============================================
// Líder (para super admin)
// ============================================
export interface LeaderFormData {
  cedula: string;
  nombre_completo: string;
  email: string;
  password: string;
  celular: string;
  barrio: string;
  departamento_votacion: string;
  municipio_votacion: string;
  puesto_votacion: string;
  direccion_votacion: string;
  mesa_votacion: string;
  observaciones?: string;
  referrer_id?: number | null;
}

export interface LeaderStats {
  total_leaders: number;
  active_leaders: number;
  inactive_leaders: number;
  leaders_with_network: number;
  average_network_size: number;
  top_leaders: TopReferrer[];
}
