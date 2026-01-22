import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '../services/auth.service';
import type { AuthUser, LoginCredentials } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isLeader: boolean;
  isLeaderPapa: boolean;
  isLeaderHijo: boolean;
  isLeaderLnpro: boolean;
  isHierarchicalLeader: boolean;
  isMember: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar usuario al montar el componente
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            setUser(storedUser);

            // Verificar con el servidor
            try {
              const { user: serverUser } = await authService.getMe();
              setUser(serverUser);
            } catch (error) {
              // Si falla, limpiar autenticación
              await authService.logout();
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  const isLeaderPapa = user?.role === 'leader_papa';
  const isLeaderHijo = user?.role === 'leader_hijo';
  const isLeaderLnpro = user?.role === 'leader_lnpro';
  const isHierarchicalLeader = isLeaderPapa || isLeaderHijo || isLeaderLnpro;

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'super_admin',
    isLeader: user?.role === 'leader' || isHierarchicalLeader,
    isLeaderPapa,
    isLeaderHijo,
    isLeaderLnpro,
    isHierarchicalLeader,
    isMember: user?.role === 'member',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
