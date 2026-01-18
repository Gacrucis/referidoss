import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import { ReferralForm } from '../components/users/ReferralForm';
import { ReferralsTable } from '../components/users/ReferralsTable';
import { AdvancedSearch } from '../components/dashboard/AdvancedSearch';
import type { PaginatedResponse, User, SearchFilters } from '../types';

export const UsersPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<PaginatedResponse<User> | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadUsers();
  }, [currentPage]);

  const loadUsers = async (filters?: SearchFilters) => {
    try {
      setLoading(true);

      // Build search query from filters
      const params: any = {
        page: currentPage,
        per_page: 15,
      };

      const activeFilters = filters || searchFilters;

      if (activeFilters.cedula) params.search = activeFilters.cedula;
      else if (activeFilters.nombre) params.search = activeFilters.nombre;
      else if (activeFilters.celular) params.search = activeFilters.celular;

      if (activeFilters.departamento) params.departamento = activeFilters.departamento;
      if (activeFilters.municipio) params.municipio = activeFilters.municipio;

      const data = await userService.getUsers(params);
      setUsers(data);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
    setCurrentPage(1);
    loadUsers(filters);
  };

  const handleSearch = (query: string) => {
    setSearchFilters({ nombre: query });
    setCurrentPage(1);
    loadUsers({ nombre: query });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleReferralSuccess = () => {
    // Reload the list after successful creation
    loadUsers();
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      await userService.exportToExcel(searchFilters);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Referidos</h1>
        <p className="text-muted-foreground mt-2">
          {isSuperAdmin
            ? 'Visualiza y administra todos los referidos del sistema'
            : 'Registra y administra los referidos de tu red'
          }
        </p>
      </div>

      {/* Form - Solo para líderes y miembros */}
      {!isSuperAdmin && (
        <ReferralForm onSuccess={handleReferralSuccess} />
      )}

      {/* Advanced Search */}
      <AdvancedSearch
        onSearch={handleAdvancedSearch}
        onExport={handleExport}
        loading={loading}
      />

      {/* Table */}
      <ReferralsTable
        data={users}
        loading={loading}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
      />
    </div>
  );
};
