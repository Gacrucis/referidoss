import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import type { User, PaginatedResponse } from '../../types';
import { UserDetailsModal } from './UserDetailsModal';

interface ReferralsTableProps {
  data: PaginatedResponse<User> | null;
  loading: boolean;
  onSearch: (query: string) => void;
  onPageChange: (page: number) => void;
}

export const ReferralsTable: React.FC<ReferralsTableProps> = ({
  data,
  loading,
  onSearch,
  onPageChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
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
        <CardTitle>Lista de Referidos</CardTitle>
        <CardDescription>Gestiona todos los referidos de tu red</CardDescription>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cédula, nombre o celular..."
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
            <p className="text-muted-foreground">No se encontraron referidos</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cedula</TableHead>
                    <TableHead>Primer Nombre</TableHead>
                    <TableHead>Segundo Nombre</TableHead>
                    <TableHead>Primer Apellido</TableHead>
                    <TableHead>Segundo Apellido</TableHead>
                    <TableHead>Celular</TableHead>
                    <TableHead>Municipio</TableHead>
                    <TableHead>Mesa</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Red</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.cedula}</TableCell>
                      <TableCell>{user.primer_nombre || '-'}</TableCell>
                      <TableCell>{user.segundo_nombre || '-'}</TableCell>
                      <TableCell>{user.primer_apellido || '-'}</TableCell>
                      <TableCell>{user.segundo_apellido || '-'}</TableCell>
                      <TableCell>{user.celular}</TableCell>
                      <TableCell className="text-sm">
                        {user.municipio_votacion}
                      </TableCell>
                      <TableCell>{user.mesa_votacion}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.level}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 text-xs">
                          <Badge variant="secondary">
                            {user.direct_referrals_count}
                          </Badge>
                          <Badge variant="default">
                            {user.total_network_count}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUserId(user.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {data.from} a {data.to} de {data.total} registros
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

      {/* User Details Modal */}
      {selectedUserId && (
        <UserDetailsModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </Card>
  );
};
