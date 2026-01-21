import React, { useEffect, useState, useCallback } from 'react';
import { okService } from '../services/ok.service';
import { OkForm } from '../components/adn/OkForm';
import { OksTable } from '../components/adn/OksTable';
import { OkDetailsModal } from '../components/adn/OkDetailsModal';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { GitBranch, Plus, Search, CheckCircle, XCircle, Users } from 'lucide-react';
import type { PaginatedResponse, Ok } from '../types';

export const AdnOksPage: React.FC = () => {
  const [oks, setOks] = useState<PaginatedResponse<Ok> | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingOk, setEditingOk] = useState<Ok | null>(null);
  const [viewingOk, setViewingOk] = useState<Ok | null>(null);

  // Estadísticas calculadas
  const stats = {
    total: oks?.total || 0,
    active: oks?.data.filter(o => o.is_active).length || 0,
    inactive: oks?.data.filter(o => !o.is_active).length || 0,
    totalLeaders: oks?.data.reduce((sum, o) => sum + (o.leaders_count || 0), 0) || 0,
  };

  const loadOks = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const data = await okService.getOks({
        page,
        search: search || undefined,
        per_page: 15,
      });
      setOks(data);
    } catch (error) {
      console.error('Error al cargar OKs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOks(currentPage, searchQuery);
  }, [currentPage, loadOks]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadOks(1, searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleEdit = (ok: Ok) => {
    setEditingOk(ok);
    setShowForm(true);
  };

  const handleDelete = async (ok: Ok) => {
    if (!confirm(`¿Estás seguro de eliminar el OK "${ok.nombre}"?`)) {
      return;
    }

    try {
      await okService.deleteOk(ok.id);
      loadOks(currentPage, searchQuery);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      alert(err.response?.data?.error || 'Error al eliminar el OK');
    }
  };

  const handleToggleActive = async (ok: Ok) => {
    try {
      await okService.updateOk(ok.id, { is_active: !ok.is_active });
      loadOks(currentPage, searchQuery);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingOk(null);
    loadOks(currentPage, searchQuery);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingOk(null);
  };

  const handleViewDetails = (ok: Ok) => {
    setViewingOk(ok);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GitBranch className="h-7 w-7 text-green-600" />
            ADN - OKs
          </h1>
          <p className="text-gray-500 mt-1">Gestiona los OKs para clasificar líderes</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4" />
          Nuevo OK
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total OKs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <GitBranch className="h-10 w-10 text-green-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Activos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-emerald-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Inactivos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
            </div>
            <XCircle className="h-10 w-10 text-orange-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-teal-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Líderes Asignados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLeaders}</p>
            </div>
            <Users className="h-10 w-10 text-teal-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <OkForm
          ok={editingOk}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}

      {/* Búsqueda */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} variant="outline">
            Buscar
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <OksTable
        oks={oks}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        onViewDetails={handleViewDetails}
        onPageChange={setCurrentPage}
      />

      {/* Modal de detalles */}
      {viewingOk && (
        <OkDetailsModal
          ok={viewingOk}
          onClose={() => setViewingOk(null)}
        />
      )}
    </div>
  );
};
