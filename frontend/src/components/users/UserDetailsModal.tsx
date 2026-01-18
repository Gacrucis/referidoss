import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { userService } from '../../services/user.service';
import { Loader2, X, User as UserIcon, Mail, Phone, MapPin, Calendar, Users, Network } from 'lucide-react';
import { DirectReferralsList } from './DirectReferralsList';
import type { User } from '../../types';

interface UserDetailsModalProps {
  userId: number;
  onClose: () => void;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  userId,
  onClose,
}) => {
  const [currentUserId, setCurrentUserId] = useState(userId);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserDetails();
  }, [currentUserId]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      const data = await userService.getUser(currentUserId);
      setUser(data);
      setError(null);
    } catch (err: any) {
      setError('Error al cargar los detalles del usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (newUserId: number) => {
    setCurrentUserId(newUserId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-8">
          <p className="text-destructive">{error || 'Error al cargar datos'}</p>
          <Button onClick={onClose} className="mt-4">
            Cerrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="bg-white p-3 rounded-full shadow-sm">
              <UserIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.nombre_completo}</h2>
              <p className="text-sm text-muted-foreground">CC: {user.cedula}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Estado y Rol */}
          <div className="flex gap-3">
            <Badge variant={user.is_active ? 'default' : 'destructive'}>
              {user.is_active ? 'Activo' : 'Inactivo'}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {user.role === 'super_admin' ? 'Super Admin' : user.role === 'leader' ? 'Líder' : 'Miembro'}
            </Badge>
          </div>

          {/* Información Personal */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
              <UserIcon className="h-5 w-5" />
              Información Personal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Nombre Completo</p>
                <p className="font-medium">{user.nombre_completo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cédula</p>
                <p className="font-medium">{user.cedula}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Barrio</p>
                <p className="font-medium">{user.barrio}</p>
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
              <Phone className="h-5 w-5" />
              Contacto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-sm break-all">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Celular</p>
                  <p className="font-medium">{user.celular}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Información de Votación */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
              <MapPin className="h-5 w-5" />
              Información de Votación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Departamento</p>
                <p className="font-medium">{user.departamento_votacion}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Municipio</p>
                <p className="font-medium">{user.municipio_votacion}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Puesto de Votación</p>
                <p className="font-medium">{user.puesto_votacion}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mesa</p>
                <p className="font-medium">{user.mesa_votacion}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Dirección del Puesto</p>
                <p className="font-medium">{user.direccion_votacion}</p>
              </div>
            </div>
          </div>

          {/* Red de Referidos */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
              <Network className="h-5 w-5" />
              Red de Referidos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">Referidos Directos</p>
                <p className="text-2xl font-bold text-blue-700">{user.direct_referrals_count}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-600 font-medium">Red Total</p>
                <p className="text-2xl font-bold text-green-700">{user.total_network_count}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-600 font-medium">Nivel</p>
                <p className="text-2xl font-bold text-purple-700">{user.level}</p>
              </div>
            </div>
            {user.referral_code && (
              <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-sm text-muted-foreground">Código de Referido</p>
                <p className="font-mono font-bold text-lg text-primary">{user.referral_code}</p>
              </div>
            )}
          </div>

          {/* Observaciones */}
          {user.observaciones && (
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-700">Observaciones</h3>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm">{user.observaciones}</p>
              </div>
            </div>
          )}

          {/* Referidos Directos */}
          {user.direct_referrals_count > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
                <Users className="h-5 w-5" />
                Referidos Directos ({user.direct_referrals_count})
              </h3>
              <DirectReferralsList userId={user.id} onViewUser={handleViewUser} />
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Registrado el {formatDate(user.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t bg-gray-50">
          <Button onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};
