import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Search, ChevronLeft, ChevronRight, Power, PowerOff, Key, Eye, Edit2, Layers, GitBranch } from 'lucide-react';
import type { User, PaginatedResponse, Linea, Ok } from '../../types';
import { leaderService } from '../../services/leader.service';
import { ChangePasswordModal } from './ChangePasswordModal';
import { LeaderDetailsModal } from './LeaderDetailsModal';
import { EditLeaderModal } from './EditLeaderModal';

interface LeadersTableProps {
  data: PaginatedResponse<User> | null;
  loading: boolean;
  onSearch: (query: string) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

export const LeadersTable: React.FC<LeadersTableProps> = ({
  data,
  loading,
  onSearch,
  onPageChange,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [toggling, setToggling] = useState<number | null>(null);
  const [passwordModal, setPasswordModal] = useState<{ id: number; name: string } | null>(null);
  const [detailsModal, setDetailsModal] = useState<{ id: number; name: string } | null>(null);
  const [editModal, setEditModal] = useState<User | null>(null);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Líderes</CardTitle>
        <CardDescription>Gestiona todos los líderes del sistema</CardDescription>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 pt-4">
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cédula</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Celular</TableHead>
                    <TableHead>Red Directa</TableHead>
                    <TableHead>Red Total</TableHead>
                    <TableHead>ADN</TableHead>
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
                      <TableCell>{leader.cedula}</TableCell>
                      <TableCell className="text-sm">{leader.email}</TableCell>
                      <TableCell>{leader.celular}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {leader.direct_referrals_count}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          {leader.total_network_count}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(leader as any).lineas?.map((l: Linea) => (
                            <Badge
                              key={l.id}
                              variant="outline"
                              className="text-xs"
                              style={{ borderColor: l.color || '#3B82F6', color: l.color || '#3B82F6' }}
                            >
                              <Layers className="h-2 w-2 mr-1" />
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
                              <GitBranch className="h-2 w-2 mr-1" />
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
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              setDetailsModal({
                                id: leader.id,
                                name: leader.nombre_completo,
                              })
                            }
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditModal(leader)}
                            title="Editar líder"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={leader.is_active ? 'outline' : 'default'}
                            onClick={() => handleToggleActive(leader.id)}
                            disabled={toggling === leader.id}
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
