import React, { useEffect, useState } from 'react';
import { leaderService } from '../services/leader.service';
import { LeaderForm } from '../components/leaders/LeaderForm';
import { LeadersTable } from '../components/leaders/LeadersTable';
import { StatCard } from '../components/dashboard/StatCard';
import { Users, UserCheck, UserX, Network, Crown, UserPlus, User as UserIcon } from 'lucide-react';
import type { PaginatedResponse, User, LeaderStats } from '../types';

export const LeadersPage: React.FC = () => {
  const [leaders, setLeaders] = useState<PaginatedResponse<User> | null>(null);
  const [stats, setStats] = useState<LeaderStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    loadData();
  }, [currentPage, roleFilter]);

  const loadData = async (search?: string) => {
    try {
      setLoading(true);
      const [leadersData, statsData] = await Promise.all([
        leaderService.getLeaders({
          search: search || searchQuery,
          role: roleFilter || undefined,
          page: currentPage,
          per_page: 15,
        }),
        leaderService.getStats(),
      ]);
      setLeaders(leadersData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading leaders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    loadData(query);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRoleFilter = (role: string) => {
    setRoleFilter(role);
    setCurrentPage(1);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Líderes</h1>
          <p className="text-muted-foreground mt-2">
            Solo super admin - Crea y administra los líderes del sistema
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Nuevo Líder
          </button>
        )}
      </div>

      {/* Stats Grid */}
      {stats && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Líderes"
              value={stats.total_leaders}
              icon={Users}
              description="Todos los líderes"
            />
            <StatCard
              title="Líderes Activos"
              value={stats.active_leaders}
              icon={UserCheck}
              description="Con acceso al sistema"
            />
            <StatCard
              title="Líderes Inactivos"
              value={stats.inactive_leaders}
              icon={UserX}
              description="Sin acceso"
            />
            <StatCard
              title="Promedio de Red"
              value={Math.round(stats.average_network_size)}
              icon={Network}
              description="Por líder"
            />
          </div>

          {/* Stats por Tipo de Líder */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Líderes Normales"
              value={stats.leader_normal_count || 0}
              icon={UserIcon}
              description="Rol básico"
            />
            <StatCard
              title="Líderes Papá"
              value={stats.leader_papa_count || 0}
              icon={Crown}
              description="Nivel jerárquico alto"
            />
            <StatCard
              title="Hijos Mayor"
              value={stats.leader_hijo_count || 0}
              icon={UserPlus}
              description="Segundo nivel"
            />
            <StatCard
              title="LnPro"
              value={stats.leader_lnpro_count || 0}
              icon={UserCheck}
              description="Tercer nivel"
            />
          </div>
        </>
      )}

      {/* Form */}
      {showForm && (
        <LeaderForm
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Table */}
      <LeadersTable
        data={leaders}
        loading={loading}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onRefresh={loadData}
        onRoleFilter={handleRoleFilter}
        currentRoleFilter={roleFilter}
      />
    </div>
  );
};
