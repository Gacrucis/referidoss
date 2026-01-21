import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { X, Users, Network, UserCheck, Loader2 } from 'lucide-react';
import { okService } from '../../services/ok.service';
import type { Ok, AdnStats, User } from '../../types';

interface OkDetailsModalProps {
  ok: Ok;
  onClose: () => void;
}

export const OkDetailsModal: React.FC<OkDetailsModalProps> = ({ ok, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<{ ok: Ok; stats: AdnStats } | null>(null);

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      try {
        const data = await okService.getOk(ok.id);
        setDetails(data as unknown as { ok: Ok; stats: AdnStats });
      } catch (error) {
        console.error('Error al cargar detalles:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [ok.id]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ backgroundColor: ok.color || '#10B981' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white text-lg font-bold">{ok.nombre.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{ok.nombre}</h2>
              <p className="text-white/80 text-sm">{ok.descripcion || 'Sin descripción'}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : details ? (
            <>
              {/* Estadísticas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-600 mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-xs font-medium">Líderes</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">{details.stats.leaders_count}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-600 mb-1">
                    <UserCheck className="h-4 w-4" />
                    <span className="text-xs font-medium">Activos</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-700">{details.stats.active_leaders}</p>
                </div>
                <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                  <div className="flex items-center gap-2 text-teal-600 mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-xs font-medium">Ref. Directos</span>
                  </div>
                  <p className="text-2xl font-bold text-teal-700">{details.stats.total_direct_referrals}</p>
                </div>
                <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                  <div className="flex items-center gap-2 text-cyan-600 mb-1">
                    <Network className="h-4 w-4" />
                    <span className="text-xs font-medium">Red Total</span>
                  </div>
                  <p className="text-2xl font-bold text-cyan-700">{details.stats.total_network}</p>
                </div>
              </div>

              {/* Lista de líderes */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Líderes en este OK</h3>
                {details.ok.leaders && details.ok.leaders.length > 0 ? (
                  <div className="bg-gray-50 rounded-lg border overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cédula</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Celular</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Red Directa</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Red Total</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {details.ok.leaders.map((leader: User) => (
                          <tr key={leader.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{leader.nombre_completo}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{leader.cedula}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{leader.celular}</td>
                            <td className="px-4 py-3 text-sm">
                              <Badge variant="secondary">{leader.direct_referrals_count || 0}</Badge>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {leader.total_network_count || 0}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Badge variant={leader.is_active ? 'default' : 'secondary'}>
                                {leader.is_active ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    No hay líderes asignados a este OK
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Error al cargar los detalles
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <Button variant="outline" onClick={onClose} className="w-full">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};
