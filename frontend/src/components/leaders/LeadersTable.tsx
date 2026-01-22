import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Search, ChevronLeft, ChevronRight, Power, PowerOff, Key, Eye, Edit2, Layers, GitBranch, Crown, UserCheck, User } from 'lucide-react';
import type { User as UserType, PaginatedResponse, Linea, Ok } from '../../types';
import { leaderService } from '../../services/leader.service';
import { ChangePasswordModal } from './ChangePasswordModal';
import { LeaderDetailsModal } from './LeaderDetailsModal';
import { EditLeaderModal } from './EditLeaderModal';

interface LeadersTableProps {
  data: PaginatedResponse<UserType> | null;
  loading: boolean;
  onSearch: (query: string) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onRoleFilter?: (role: string) => void;
  currentRoleFilter?: string;
}

export const LeadersTable: React.FC<LeadersTableProps> = ({
  data,
  loading,
  onSearch,
  onPageChange,
  onRefresh,
  onRoleFilter,
  currentRoleFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [toggling, setToggling] = useState<number | null>(null);
  const [passwordModal, setPasswordModal] = useState<{ id: number; name: string } | null>(null);
  const [detailsModal, setDetailsModal] = useState<{ id: number; name: string } | null>(null);
  const [editModal, setEditModal] = useState<UserType | null>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleToggleActive = async (id: number) => {
    try {
      setToggling(id);
      await leaderService.toggleActive(id);
      onRefresh();
    } catch (error) {
      console.error('Error toggling leader:', error);
    } finally {
      setToggling(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'leader_papa':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Crown className="h-3 w-3 mr-1" />
            Papá
          </Badge>
        );
      case 'leader_hijo':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-300">
            <UserCheck className="h-3 w-3 mr-1" />
            Hijo
          </Badge>
        );
      case 'leader_lnpro':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <User className="h-3 w-3 mr-1" />
            LnPro
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            <User className="h-3 w-3 mr-1" />
            Normal
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Líderes</CardTitle>
        <CardDescription>Gestiona todos los líderes del sistema</CardDescription>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 pt-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cédula, nombre o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button type="submit" disabled={loading}>
              Buscar
            </Button>
          </form>

          {/* Role Filter */}
          {onRoleFilter && (
            <select
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={currentRoleFilter || ''}
              onChange={(e) => onRoleFilter(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              <option value="leader">Líder Normal</option>
              <option value="leader_papa">Líder Papá</option>
              <option value="leader_hijo">Hijo Mayor</option>
              <option value="leader_lnpro">LnPro</option>
            </select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
            </div>
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No se encontraron líderes</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cédula</TableHead>
                    <TableHead>Celular</TableHead>
                    <TableHead>Red</TableHead>
                    <TableHead>ADN</TableHead>
                    <TableHead>Entidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((leader) => (
                    <TableRow key={leader.id}>
                      <TableCell className="font-medium">
                        {leader.nombre_completo}
                      </TableCell>
                      <TableCell>
                        {getRoleBadge((leader as any).role || 'leader')}
                      </TableCell>
                      <TableCell>{leader.cedula}</TableCell>
                      <TableCell>{leader.celular}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {leader.direct_referrals_count} directos
                          </Badge>
                          <Badge variant="default" className="text-xs">
                            {leader.total_network_count} total
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(leader as any).adn_type === 'linea' ? (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                            <Layers className="h-3 w-3 mr-1" />
                            Líneas
                          </Badge>
                        ) : (leader as any).adn_type === 'ok' ? (
                          <Badge className="bg-green-100 text-green-700 border-green-300">
                            <GitBranch className="h-3 w-3 mr-1" />
                            OKs
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {(leader as any).lineas?.map((l: Linea) => (
                            <Badge
                              key={l.id}
                              variant="outline"
                              className="text-xs"
                              style={{ borderColor: l.color || '#3B82F6', color: l.color || '#3B82F6' }}
                            >
                              {l.nombre}
                            </Badge>
                          ))}
                          {(leader as any).oks?.map((o: Ok) => (
                            <Badge
                              key={o.id}
                              variant="outline"
                              className="text-xs"
                              style={{ borderColor: o.color || '#10B981', color: o.color || '#10B981' }}
                            >
                              {o.nombre}
                            </Badge>
                          ))}
                          {!(leader as any).lineas?.length && !(leader as any).oks?.length && (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {leader.is_active ? (
                          <Badge variant="default">Activo</Badge>
                        ) : (
                          <Badge variant="destructive">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(leader.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setDetailsModal({
                                id: leader.id,
                                name: leader.nombre_completo,
                              })
                            }
                            title="Ver detalles"
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditModal(leader)}
                            title="Editar líder"
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={leader.is_active ? 'outline' : 'default'}
                            onClick={() => handleToggleActive(leader.id)}
                            disabled={toggling === leader.id}
                            title={leader.is_active ? 'Desactivar' : 'Activar'}
                            className="h-8 w-8 p-0"
                          >
                            {leader.is_active ? (
                              <PowerOff className="h-4 w-4" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              setPasswordModal({
                                id: leader.id,
                                name: leader.nombre_completo,
                              })
                            }
                            title="Cambiar contraseña"
                            className="h-8 w-8 p-0"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {data.from} a {data.to} de {data.total} líderes
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(data.current_page - 1)}
                  disabled={data.current_page === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  <span className="text-sm">
                    Página {data.current_page} de {data.last_page}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(data.current_page + 1)}
                  disabled={data.current_page === data.last_page || loading}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      {/* Leader Details Modal */}
      {detailsModal && (
        <LeaderDetailsModal
          leaderId={detailsModal.id}
          leaderName={detailsModal.name}
          onClose={() => setDetailsModal(null)}
        />
      )}

      {/* Change Password Modal */}
      {passwordModal && (
        <ChangePasswordModal
          leaderId={passwordModal.id}
          leaderName={passwordModal.name}
          onClose={() => setPasswordModal(null)}
          onSuccess={() => {
            setPasswordModal(null);
            onRefresh();
          }}
        />
      )}

      {/* Edit Leader Modal */}
      {editModal && (
        <EditLeaderModal
          leader={editModal}
          onClose={() => setEditModal(null)}
          onSuccess={() => {
            setEditModal(null);
            onRefresh();
          }}
        />
      )}
    </Card>
  );
};
