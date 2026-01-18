import React, { useEffect, useState, useCallback } from 'react';
import { adminService, type AdminUserFilters, type UserForSelect } from '../services/admin.service';
import { userService } from '../services/user.service';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { UserDetailsModal } from '../components/users/UserDetailsModal';
import {
  Users,
  Search,
  Loader2,
  Eye,
  Edit,
  Trash2,
  MoveRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  AlertTriangle,
  Download,
} from 'lucide-react';
import type { PaginatedResponse, User } from '../types';

export const AdminUsersPage: React.FC = () => {
  const { user: authUser } = useAuth();
  const isSuperAdmin = authUser?.role === 'super_admin';
  const [users, setUsers] = useState<PaginatedResponse<User> | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<AdminUserFilters>({
    page: 1,
    per_page: 20,
  });

  // Modal states
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [movingUser, setMovingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteNetwork, setDeleteNetwork] = useState(false);

  // Move user state
  const [searchReferrer, setSearchReferrer] = useState('');
  const [referrerOptions, setReferrerOptions] = useState<UserForSelect[]>([]);
  const [selectedReferrer, setSelectedReferrer] = useState<UserForSelect | null>(null);
  const [searchingReferrer, setSearchingReferrer] = useState(false);

  // Action loading
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers(filters);
      setUsers(data);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchQuery, page: 1 }));
  };

  const handleFilterChange = (key: keyof AdminUserFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({ page: 1, per_page: 20 });
  };

  // Search referrer for move
  const searchReferrerUsers = useCallback(async (search: string) => {
    if (!search || search.length < 2) {
      setReferrerOptions([]);
      return;
    }

    try {
      setSearchingReferrer(true);
      const results = await adminService.searchUsersForSelect(search, movingUser?.id);
      setReferrerOptions(results);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearchingReferrer(false);
    }
  }, [movingUser]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchReferrerUsers(searchReferrer);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchReferrer, searchReferrerUsers]);

  // Actions
  const handleMoveUser = async () => {
    if (!movingUser || !selectedReferrer) return;

    try {
      setActionLoading(true);
      await adminService.moveUser(movingUser.id, selectedReferrer.id);
      setMovingUser(null);
      setSelectedReferrer(null);
      setSearchReferrer('');
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al mover usuario');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      setActionLoading(true);
      await adminService.deleteUser(deletingUser.id, deleteNetwork);
      setDeletingUser(null);
      setDeleteNetwork(false);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar usuario');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (data: Partial<User>) => {
    if (!editingUser) return;

    try {
      setActionLoading(true);
      await adminService.updateUser(editingUser.id, data);
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al actualizar usuario');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await userService.exportToExcel(filters);
    } catch (err) {
      console.error('Error exporting:', err);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-red-100 text-red-800">Super Admin</Badge>;
      case 'leader':
        return <Badge className="bg-blue-100 text-blue-800">Lider</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Miembro</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isSuperAdmin ? 'Gestion de Usuarios' : 'Gestion de Mi Red'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isSuperAdmin
              ? 'Panel completo para administrar todos los usuarios del sistema'
              : 'Administra los usuarios de tu red de referidos'}
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar por nombre, cedula, celular o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Role filter - Solo para super admin */}
            {isSuperAdmin && (
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={filters.role || ''}
                onChange={(e) => handleFilterChange('role', e.target.value || undefined)}
              >
                <option value="">Todos los roles</option>
                <option value="leader">Lideres</option>
                <option value="member">Miembros</option>
              </select>
            )}

            {/* Status filter - Solo para super admin */}
            {isSuperAdmin && (
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={filters.is_active === undefined ? '' : filters.is_active ? 'true' : 'false'}
                onChange={(e) => handleFilterChange('is_active', e.target.value === '' ? undefined : e.target.value === 'true')}
              >
                <option value="">Todos los estados</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            )}
          </div>

          {(filters.search || filters.role || filters.is_active !== undefined) && (
            <div className="mt-4">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referidor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nivel</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Red</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users?.data.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-sm">{user.nombre_completo}</p>
                            <p className="text-xs text-muted-foreground">CC: {user.cedula}</p>
                            <p className="text-xs text-muted-foreground">{user.celular}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-4 py-3">
                          {user.referrer ? (
                            <button
                              onClick={() => setSelectedUserId(user.referrer!.id)}
                              className="text-sm text-blue-600 hover:underline text-left"
                            >
                              {user.referrer.nombre_completo}
                              <br />
                              <span className="text-xs text-gray-500">CC: {user.referrer.cedula}</span>
                            </button>
                          ) : (
                            <span className="text-sm text-gray-400">Sin referidor</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{user.level}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <p><span className="text-muted-foreground">Directos:</span> {user.direct_referrals_count}</p>
                            <p><span className="text-muted-foreground">Total:</span> {user.total_network_count}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={user.is_active ? 'default' : 'destructive'}>
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedUserId(user.id)}
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {user.role !== 'super_admin' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingUser(user)}
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {/* Mover usuario - Solo para super admin */}
                                {isSuperAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setMovingUser(user)}
                                    title="Mover a otro referidor"
                                  >
                                    <MoveRight className="h-4 w-4" />
                                  </Button>
                                )}
                                {/* Eliminar - Super admin puede eliminar todo, lider solo miembros */}
                                {(isSuperAdmin || user.role !== 'leader') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeletingUser(user)}
                                    title="Eliminar"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {users && users.last_page > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {users.from} - {users.to} de {users.total} usuarios
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={users.current_page === 1}
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page! - 1 }))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                      {users.current_page} / {users.last_page}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={users.current_page === users.last_page}
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page! + 1 }))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Details Modal */}
      {selectedUserId && (
        <UserDetailsModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Editar Usuario</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {editingUser.nombre_completo} - CC: {editingUser.cedula}
            </p>

            <div className="space-y-4">
              {/* Datos básicos - Todos pueden editar */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Primer Nombre</label>
                  <Input
                    value={editingUser.primer_nombre || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, primer_nombre: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Segundo Nombre</label>
                  <Input
                    value={editingUser.segundo_nombre || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, segundo_nombre: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Primer Apellido</label>
                  <Input
                    value={editingUser.primer_apellido || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, primer_apellido: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Segundo Apellido</label>
                  <Input
                    value={editingUser.segundo_apellido || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, segundo_apellido: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Celular</label>
                <Input
                  value={editingUser.celular || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, celular: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Barrio</label>
                <Input
                  value={editingUser.barrio || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, barrio: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Observaciones</label>
                <textarea
                  value={editingUser.observaciones || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, observaciones: e.target.value })}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                  rows={3}
                />
              </div>

              {/* Rol y Estado - Solo super admin */}
              {isSuperAdmin && (
                <>
                  <div className="border-t pt-4 mt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-3">Configuración de Admin</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Rol</label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm mt-1"
                        value={editingUser.role}
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                      >
                        <option value="leader">Lider</option>
                        <option value="member">Miembro</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Estado</label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm mt-1"
                        value={editingUser.is_active ? 'true' : 'false'}
                        onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.value === 'true' })}
                      >
                        <option value="true">Activo</option>
                        <option value="false">Inactivo</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  const updateData: Partial<User> = {
                    primer_nombre: editingUser.primer_nombre,
                    segundo_nombre: editingUser.segundo_nombre,
                    primer_apellido: editingUser.primer_apellido,
                    segundo_apellido: editingUser.segundo_apellido,
                    celular: editingUser.celular,
                    barrio: editingUser.barrio,
                    observaciones: editingUser.observaciones,
                  };
                  if (isSuperAdmin) {
                    updateData.role = editingUser.role;
                    updateData.is_active = editingUser.is_active;
                  }
                  handleUpdateUser(updateData);
                }}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Move Modal */}
      {movingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold mb-4">Mover Usuario</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Mover a <strong>{movingUser.nombre_completo}</strong> a otro referidor
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Buscar nuevo referidor</label>
                <Input
                  placeholder="Buscar por nombre o cedula..."
                  value={searchReferrer}
                  onChange={(e) => setSearchReferrer(e.target.value)}
                  className="mt-1"
                />
              </div>

              {searchingReferrer && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando...
                </div>
              )}

              {referrerOptions.length > 0 && (
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {referrerOptions.map((user) => (
                    <button
                      key={user.id}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 border-b last:border-b-0 ${
                        selectedReferrer?.id === user.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedReferrer(user)}
                    >
                      <p className="font-medium text-sm">{user.nombre_completo}</p>
                      <p className="text-xs text-muted-foreground">
                        CC: {user.cedula} | {user.role === 'leader' ? 'Lider' : 'Miembro'} | Nivel {user.level}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {selectedReferrer && (
                <div className="bg-green-50 p-3 rounded-md border border-green-200">
                  <p className="text-sm text-green-800">
                    Seleccionado: <strong>{selectedReferrer.nombre_completo}</strong>
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => {
                setMovingUser(null);
                setSelectedReferrer(null);
                setSearchReferrer('');
              }}>
                Cancelar
              </Button>
              <Button
                onClick={handleMoveUser}
                disabled={actionLoading || !selectedReferrer}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mover'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold">Eliminar Usuario</h3>
            </div>

            <p className="text-sm mb-4">
              Estas a punto de eliminar a <strong>{deletingUser.nombre_completo}</strong>.
            </p>

            {deletingUser.total_network_count > 0 && (
              <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mb-4">
                <p className="text-sm text-yellow-800">
                  Este usuario tiene <strong>{deletingUser.total_network_count}</strong> personas en su red.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="deleteOption"
                  checked={!deleteNetwork}
                  onChange={() => setDeleteNetwork(false)}
                />
                <span className="text-sm">
                  Solo eliminar usuario (reasignar red al padre)
                </span>
              </label>

              {deletingUser.total_network_count > 0 && (
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="deleteOption"
                    checked={deleteNetwork}
                    onChange={() => setDeleteNetwork(true)}
                  />
                  <span className="text-sm text-red-600">
                    Eliminar usuario Y toda su red ({deletingUser.total_network_count} personas)
                  </span>
                </label>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => {
                setDeletingUser(null);
                setDeleteNetwork(false);
              }}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
