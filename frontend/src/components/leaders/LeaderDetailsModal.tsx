import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { leaderService } from '../../services/leader.service';
import { userService } from '../../services/user.service';
import api from '../../services/api';
import { Loader2, X, User, Network, Users, Eye, ChevronLeft, Mail, Phone, Hash, Layers } from 'lucide-react';
import type { User as UserType, PaginatedResponse } from '../../types';

interface LeaderDetailsModalProps {
  leaderId: number;
  leaderName: string;
  onClose: () => void;
}

interface ViewHistory {
  id: number;
  name: string;
}

export const LeaderDetailsModal: React.FC<LeaderDetailsModalProps> = ({
  leaderId,
  leaderName,
  onClose,
}) => {
  const [currentUserId, setCurrentUserId] = useState(leaderId);
  const [currentUserName, setCurrentUserName] = useState(leaderName);
  const [leader, setLeader] = useState<any>(null);
  const [referrals, setReferrals] = useState<PaginatedResponse<UserType> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [viewHistory, setViewHistory] = useState<ViewHistory[]>([]);

  useEffect(() => {
    loadUserDetails();
    setCurrentPage(1);
  }, [currentUserId]);

  useEffect(() => {
    if (leader) {
      loadReferrals();
    }
  }, [currentPage, leader]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      let data;
      try {
        // Intentar primero con el endpoint de líderes (devuelve { leader, network_stats })
        data = await leaderService.getLeader(currentUserId);
      } catch {
        // Si falla (usuario no es líder), usar endpoint de usuarios (devuelve el usuario directo)
        const response = await api.get(`/users/${currentUserId}`);
        const userData = response.data;
        // Normalizar la respuesta para que tenga la misma estructura
        data = {
          leader: userData,
          network_stats: {
            direct_referrals: userData.direct_referrals_count || 0,
            total_network: userData.total_network_count || 0,
            max_depth: 0,
            last_7_days: 0,
            last_30_days: 0,
          }
        };
      }
      setLeader(data);
    } catch (err: any) {
      console.error('Error loading user details:', err);
      setError('Error al cargar los detalles del usuario');
    } finally {
      setLoading(false);
    }
  };

  const loadReferrals = async () => {
    try {
      setLoadingReferrals(true);
      const data = await userService.getUsers({
        referrer_id: currentUserId,
        page: currentPage,
        per_page: 10,
      });
      setReferrals(data);
    } catch (err: any) {
      console.error('Error loading referrals:', err);
    } finally {
      setLoadingReferrals(false);
    }
  };

  const handleViewUser = (userId: number, userName: string) => {
    // Guardar el usuario actual en el historial
    setViewHistory((prev) => [...prev, { id: currentUserId, name: currentUserName }]);
    setCurrentUserId(userId);
    setCurrentUserName(userName);
  };

  const handleGoBack = () => {
    if (viewHistory.length > 0) {
      const previousUser = viewHistory[viewHistory.length - 1];
      setViewHistory((prev) => prev.slice(0, -1));
      setCurrentUserId(previousUser.id);
      setCurrentUserName(previousUser.name);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !leader) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 p-8">
          <p className="text-destructive text-center">{error || 'Error al cargar datos'}</p>
          <div className="flex justify-center mt-4">
            <Button onClick={onClose}>Cerrar</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full my-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {viewHistory.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGoBack}
                  className="text-white hover:bg-white/20"
                >
                  <ChevronLeft className="h-5 w-5 mr-1" />
                  Volver
                </Button>
              )}
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-full">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{currentUserName}</h2>
                  <p className="text-white/80 text-sm">
                    {viewHistory.length === 0 ? 'Líder Principal' : `Nivel ${leader.leader?.level || 1}`}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/20 rounded-full"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Estadísticas de Red */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
              <Network className="h-5 w-5 text-primary" />
              Estadísticas de Red
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-blue-600" />
                  <p className="text-xs text-blue-600 font-medium">Referidos Directos</p>
                </div>
                <p className="text-3xl font-bold text-blue-700">
                  {leader.network_stats?.direct_referrals || leader.leader?.direct_referrals_count || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <Network className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-green-600 font-medium">Red Total</p>
                </div>
                <p className="text-3xl font-bold text-green-700">
                  {leader.network_stats?.total_network || leader.leader?.total_network_count || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-purple-600" />
                  <p className="text-xs text-purple-600 font-medium">Últimos 7 días</p>
                </div>
                <p className="text-3xl font-bold text-purple-700">
                  {leader.network_stats?.last_7_days || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="h-4 w-4 text-orange-600" />
                  <p className="text-xs text-orange-600 font-medium">Niveles</p>
                </div>
                <p className="text-3xl font-bold text-orange-700">
                  {leader.network_stats?.max_depth || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Información del Usuario */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3 text-gray-600">Información de Contacto</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium truncate">{leader.leader?.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Celular</p>
                  <p className="text-sm font-medium">{leader.leader?.celular || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Código Referido</p>
                  <p className="text-sm font-medium font-mono">{leader.leader?.referral_code || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Nivel</p>
                  <p className="text-sm font-medium">{leader.leader?.level || 1}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Referidos Directos */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
              <Users className="h-5 w-5 text-primary" />
              Referidos Directos
              <Badge variant="secondary" className="ml-2">
                {leader.network_stats?.direct_referrals || leader.leader?.direct_referrals_count || 0}
              </Badge>
            </h3>

            {loadingReferrals ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !referrals || referrals.data.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No hay referidos directos</p>
              </div>
            ) : (
              <>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre</th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Cédula</th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Celular</th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Municipio</th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Red</th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {referrals.data.map((referral) => (
                        <tr key={referral.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-3 text-sm font-medium text-gray-900">{referral.nombre_completo}</td>
                          <td className="p-3 text-sm text-gray-600">{referral.cedula}</td>
                          <td className="p-3 text-sm text-gray-600">{referral.celular}</td>
                          <td className="p-3 text-sm text-gray-600">{referral.municipio_votacion}</td>
                          <td className="p-3">
                            {referral.is_active ? (
                              <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                                Activo
                              </Badge>
                            ) : (
                              <Badge variant="destructive">Inactivo</Badge>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge variant="secondary">
                              {referral.direct_referrals_count} directos
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleViewUser(referral.id, referral.nombre_completo)}
                              className="gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              Ver
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                {referrals.last_page > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-500">
                      Mostrando {referrals.from} a {referrals.to} de {referrals.total}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1 || loadingReferrals}
                      >
                        Anterior
                      </Button>
                      <span className="flex items-center px-3 text-sm text-gray-600">
                        Página {currentPage} de {referrals.last_page}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(referrals.last_page, p + 1))
                        }
                        disabled={currentPage === referrals.last_page || loadingReferrals}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t bg-gray-50 rounded-b-xl">
          <Button onClick={onClose} variant="outline">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};
