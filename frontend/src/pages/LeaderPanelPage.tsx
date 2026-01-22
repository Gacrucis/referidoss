import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { leaderHierarchyService } from '../services/leaderHierarchy.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Users,
  UserPlus,
  Link as LinkIcon,
  Copy,
  Check,
  Crown,
  UserCheck,
  Network,
  Layers,
  GitBranch,
  ChevronRight,
} from 'lucide-react';
import type { LeaderDashboard } from '../types';

export const LeaderPanelPage: React.FC = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<LeaderDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState<'nietos' | 'subleaders' | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await leaderHierarchyService.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'nietos' | 'subleaders') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(type);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'leader_papa':
        return 'Líder Papá';
      case 'leader_hijo':
        return 'Líder Hijo Mayor';
      case 'leader_lnpro':
        return 'Líder LnPro';
      default:
        return 'Líder';
    }
  };

  const getSubleaderTypeName = (type: string | null) => {
    switch (type) {
      case 'leader_hijo':
        return 'Hijos Mayor';
      case 'leader_lnpro':
        return 'LnPro';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando panel...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Error al cargar el panel. Por favor, recarga la página.
        </div>
      </div>
    );
  }

  const baseUrl = window.location.origin;
  const nietosLink = `${baseUrl}/registro/${dashboard.leader.referral_code}`;
  const subleadersLink = dashboard.leader.leader_referral_code
    ? `${baseUrl}/registro-lider/${dashboard.leader.leader_referral_code}`
    : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Crown className="h-7 w-7 text-yellow-500" />
            Panel de {getRoleName(dashboard.leader.role)}
          </h1>
          <p className="text-gray-600 mt-1">
            Bienvenido, {dashboard.leader.nombre_completo}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dashboard.leader.adn_type === 'linea' && dashboard.leader.lineas?.map(l => (
            <Badge
              key={l.id}
              className="text-sm"
              style={{ backgroundColor: l.color || '#3B82F6', color: 'white' }}
            >
              <Layers className="h-3 w-3 mr-1" />
              {l.nombre}
            </Badge>
          ))}
          {dashboard.leader.adn_type === 'ok' && dashboard.leader.oks?.map(o => (
            <Badge
              key={o.id}
              className="text-sm"
              style={{ backgroundColor: o.color || '#10B981', color: 'white' }}
            >
              <GitBranch className="h-3 w-3 mr-1" />
              {o.nombre}
            </Badge>
          ))}
        </div>
      </div>

      {/* Links de Referido */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Link para Nietos (Miembros) */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
              <Users className="h-5 w-5" />
              Link para Referidos (Nietos)
            </CardTitle>
            <CardDescription>
              Comparte este link para agregar miembros a tu red
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-white rounded-lg border text-sm font-mono truncate">
                {nietosLink}
              </div>
              <Button
                onClick={() => copyToClipboard(nietosLink, 'nietos')}
                variant={copiedLink === 'nietos' ? 'default' : 'outline'}
                className="shrink-0"
              >
                {copiedLink === 'nietos' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Código: <span className="font-mono font-bold">{dashboard.leader.referral_code}</span>
            </p>
          </CardContent>
        </Card>

        {/* Link para Sub-líderes (si puede crear) */}
        {dashboard.can_create_subleaders && subleadersLink && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                <UserPlus className="h-5 w-5" />
                Link para {getSubleaderTypeName(dashboard.subleader_type)}
              </CardTitle>
              <CardDescription>
                Comparte este link para agregar líderes a tu jerarquía
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-white rounded-lg border text-sm font-mono truncate">
                  {subleadersLink}
                </div>
                <Button
                  onClick={() => copyToClipboard(subleadersLink, 'subleaders')}
                  variant={copiedLink === 'subleaders' ? 'default' : 'outline'}
                  className="shrink-0"
                >
                  {copiedLink === 'subleaders' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-green-600 mt-2">
                Código: <span className="font-mono font-bold">{dashboard.leader.leader_referral_code}</span>
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Mis Referidos Directos */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mis Referidos Directos</CardDescription>
            <CardTitle className="text-3xl">{dashboard.stats.my_direct_referrals}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Nietos que yo referí
            </div>
          </CardContent>
        </Card>

        {/* Mi Red Total */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mi Red Total</CardDescription>
            <CardTitle className="text-3xl">{dashboard.stats.my_network}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Network className="h-3 w-3" />
              Incluyendo sub-niveles
            </div>
          </CardContent>
        </Card>

        {/* Sub-líderes Directos */}
        {dashboard.can_create_subleaders && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Sub-líderes Directos</CardDescription>
              <CardTitle className="text-3xl">{dashboard.stats.direct_subleaders}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <UserCheck className="h-3 w-3" />
                {getSubleaderTypeName(dashboard.subleader_type)} que creé
              </div>
            </CardContent>
          </Card>
        )}

        {/* Red de Miembros Acumulada */}
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-purple-700">Red Total Acumulada</CardDescription>
            <CardTitle className="text-3xl text-purple-900">{dashboard.stats.total_network_members}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-purple-600 flex items-center gap-1">
              <Network className="h-3 w-3" />
              Todos los miembros de tu jerarquía
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Más estadísticas de jerarquía */}
      {(dashboard.stats.hijos_mayores > 0 || dashboard.stats.lnpros > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Jerarquía de Líderes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">{dashboard.stats.total_subleaders}</div>
                <div className="text-sm text-yellow-600">Total Sub-líderes</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{dashboard.stats.hijos_mayores}</div>
                <div className="text-sm text-blue-600">Hijos Mayor</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{dashboard.stats.lnpros}</div>
                <div className="text-sm text-green-600">LnPro</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accesos rápidos */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/leader/subleaders'}>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <UserPlus className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Mis Sub-líderes</h3>
                <p className="text-sm text-gray-500">Gestionar {getSubleaderTypeName(dashboard.subleader_type)}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/leader/referrals'}>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Mis Referidos</h3>
                <p className="text-sm text-gray-500">Ver nietos directos</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/leader/network'}>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Network className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Red Completa</h3>
                <p className="text-sm text-gray-500">Todos los miembros</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
