import React, { useEffect, useState, useCallback } from 'react';
import { lineaService } from '../services/linea.service';
import { LineaForm } from '../components/adn/LineaForm';
import { LineasTable } from '../components/adn/LineasTable';
import { LineaDetailsModal } from '../components/adn/LineaDetailsModal';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Layers, Plus, Search, CheckCircle, XCircle, Users } from 'lucide-react';
import type { PaginatedResponse, Linea } from '../types';

export const AdnLineasPage: React.FC = () => {
  const [lineas, setLineas] = useState<PaginatedResponse<Linea> | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingLinea, setEditingLinea] = useState<Linea | null>(null);
  const [viewingLinea, setViewingLinea] = useState<Linea | null>(null);

  // Estadísticas calculadas
  const stats = {
    total: lineas?.total || 0,
    active: lineas?.data.filter(l => l.is_active).length || 0,
    inactive: lineas?.data.filter(l => !l.is_active).length || 0,
    totalLeaders: lineas?.data.reduce((sum, l) => sum + (l.leaders_count || 0), 0) || 0,
  };

  const loadLineas = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const data = await lineaService.getLineas({
        page,
        search: search || undefined,
        per_page: 15,
      });
      setLineas(data);
    } catch (error) {
      console.error('Error al cargar líneas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLineas(currentPage, searchQuery);
  }, [currentPage, loadLineas]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadLineas(1, searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleEdit = (linea: Linea) => {
    setEditingLinea(linea);
    setShowForm(true);
  };

  const handleDelete = async (linea: Linea) => {
    if (!confirm(`¿Estás seguro de eliminar la línea "${linea.nombre}"?`)) {
      return;
    }

    try {
      await lineaService.deleteLinea(linea.id);
      loadLineas(currentPage, searchQuery);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      alert(err.response?.data?.error || 'Error al eliminar la línea');
    }
  };

  const handleToggleActive = async (linea: Linea) => {
    try {
      await lineaService.updateLinea(linea.id, { is_active: !linea.is_active });
      loadLineas(currentPage, searchQuery);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingLinea(null);
    loadLineas(currentPage, searchQuery);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingLinea(null);
  };

  const handleViewDetails = (linea: Linea) => {
    setViewingLinea(linea);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="h-7 w-7 text-blue-600" />
            ADN - Líneas
          </h1>
          <p className="text-gray-500 mt-1">Gestiona las líneas para clasificar líderes</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nueva Línea
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Líneas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Layers className="h-10 w-10 text-blue-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Activas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Inactivas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
            </div>
            <XCircle className="h-10 w-10 text-orange-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Líderes Asignados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLeaders}</p>
            </div>
            <Users className="h-10 w-10 text-purple-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <LineaForm
          linea={editingLinea}
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
      <LineasTable
        lineas={lineas}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        onViewDetails={handleViewDetails}
        onPageChange={setCurrentPage}
      />

      {/* Modal de detalles */}
      {viewingLinea && (
        <LineaDetailsModal
          linea={viewingLinea}
          onClose={() => setViewingLinea(null)}
        />
      )}
    </div>
  );
};
