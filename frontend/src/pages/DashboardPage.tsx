import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboard.service';
import { StatCard } from '../components/dashboard/StatCard';
import { GrowthChart } from '../components/dashboard/GrowthChart';
import { TopReferrersTable } from '../components/dashboard/TopReferrersTable';
import { RecentReferralsTable } from '../components/dashboard/RecentReferralsTable';
import { ReferralCodeCard } from '../components/dashboard/ReferralCodeCard';
import { Users, Network, TrendingUp, Crown } from 'lucide-react';
import type { DashboardStats, GrowthDataPoint, TopReferrer, User } from '../types';

export const DashboardPage: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [growth, setGrowth] = useState<GrowthDataPoint[]>([]);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [recentReferrals, setRecentReferrals] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, growthData, topData, recentData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getGrowth(30),
        dashboardService.getTopReferrers(5),
        dashboardService.getRecentReferrals(5),
      ]);

      setStats(statsData);
      setGrowth(growthData);
      setTopReferrers(topData);
      setRecentReferrals(recentData);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.response?.data?.message || 'Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-md">
          <p className="text-destructive font-medium">Error</p>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Bienvenido, {user?.nombre_completo}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isSuperAdmin ? (
          <>
            <StatCard
              title="Total Usuarios"
              value={stats.total_users || 0}
              icon={Users}
              description="Todos los usuarios del sistema"
            />
            <StatCard
              title="Total Líderes"
              value={stats.total_leaders || 0}
              icon={Crown}
              description="Líderes activos"
            />
            <StatCard
              title="Total Miembros"
              value={stats.total_members || 0}
              icon={Network}
              description="Miembros referidos"
            />
            <StatCard
              title="Crecimiento (30 días)"
              value={stats.growth_last_30_days || 0}
              icon={TrendingUp}
              description="Nuevos en el último mes"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Referidos Directos"
              value={stats.direct_referrals || 0}
              icon={Users}
              description="Personas que referiste"
            />
            <StatCard
              title="Red Total"
              value={stats.total_network || 0}
              icon={Network}
              description="Toda tu red descendente"
            />
            <StatCard
              title="Últimos 7 días"
              value={stats.last_7_days || 0}
              icon={TrendingUp}
              description="Nuevos esta semana"
            />
            <StatCard
              title="Últimos 30 días"
              value={stats.last_30_days || 0}
              icon={TrendingUp}
              description="Nuevos este mes"
            />
          </>
        )}
      </div>

      {/* Referral Code Card - Solo para líderes y miembros */}
      {!isSuperAdmin && (
        <ReferralCodeCard />
      )}

      {/* Growth Chart */}
      {growth.length > 0 && (
        <GrowthChart
          data={growth}
          title="Crecimiento de la Red"
          description="Nuevos referidos en los últimos 30 días"
        />
      )}

      {/* Tables Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <TopReferrersTable
          referrers={topReferrers}
          title={isSuperAdmin ? 'Top 5 Líderes' : 'Top 5 de tu Red'}
          description={
            isSuperAdmin
              ? 'Líderes con mayor red'
              : 'Los mejores referidores de tu red'
          }
        />
        <RecentReferralsTable
          referrals={recentReferrals}
          title="Referidos Recientes"
          description={
            isSuperAdmin
              ? 'Últimos registros del sistema'
              : 'Últimos registros en tu red'
          }
        />
      </div>
    </div>
  );
};
