import React, { useEffect, useState, useCallback } from 'react';
import { leaderPapaService, type LeaderHierarchyNode } from '../services/leaderPapa.service';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Crown,
  Search,
  Users,
  Network,
  Power,
  PowerOff,
  Layers,
  GitBranch,
  ChevronDown,
  ChevronRight,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Loader2,
  UserCheck,
  Copy,
  Check,
  Eye,
  X,
  Calendar,
  Building,
  Hash,
} from 'lucide-react';
import type { LeaderPapaStats } from '../types';

export const LeaderPapasPage: React.FC = () => {
  const [hierarchy, setHierarchy] = useState<LeaderHierarchyNode[]>([]);
  const [stats, setStats] = useState<LeaderPapaStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [toggling, setToggling] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [detailModal, setDetailModal] = useState<LeaderHierarchyNode | null>(null);

  const loadHierarchy = useCallback(async () => {
    setLoading(true);
    try {
      const data = await leaderPapaService.getFullHierarchy();
      setHierarchy(data.hierarchy);
      const papaIds = new Set(data.hierarchy.map(p => p.id));
      setExpandedNodes(papaIds);
    } catch (error) {
      console.error('Error loading hierarchy:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await leaderPapaService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  useEffect(() => {
    loadHierarchy();
    loadStats();
  }, [loadHierarchy, loadStats]);

  const handleToggleActive = async (id: number) => {
    try {
      setToggling(id);
      await leaderPapaService.toggleActive(id);
      loadHierarchy();
      loadStats();
    } catch (error) {
      console.error('Error toggling leader:', error);
    } finally {
      setToggling(null);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const allIds = new Set<number>();
    const collectIds = (nodes: LeaderHierarchyNode[]) => {
      nodes.forEach(node => {
        allIds.add(node.id);
        if (node.children.length > 0) {
          collectIds(node.children);
        }
      });
    };
    collectIds(hierarchy);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(type);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const filterHierarchy = (nodes: LeaderHierarchyNode[], query: string): LeaderHierarchyNode[] => {
    if (!query) return nodes;

    const lowerQuery = query.toLowerCase();

    return nodes.reduce((acc: LeaderHierarchyNode[], node) => {
      const matches =
        node.nombre_completo.toLowerCase().includes(lowerQuery) ||
        node.cedula.includes(query) ||
        node.celular.includes(query);

      const filteredChildren = filterHierarchy(node.children, query);

      if (matches || filteredChildren.length > 0) {
        acc.push({
          ...node,
          children: filteredChildren.length > 0 ? filteredChildren : node.children,
        });
      }

      return acc;
    }, []);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'leader_papa':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Crown className="h-3 w-3 mr-1" />
            Líder Papá
          </Badge>
        );
      case 'leader_hijo':
        return (
          <Badge className="bg-purple-100 text-purple-800">
            <UserCheck className="h-3 w-3 mr-1" />
            Hijo Mayor
          </Badge>
        );
      case 'leader_lnpro':
        return (
          <Badge className="bg-green-100 text-green-800">
            <User className="h-3 w-3 mr-1" />
            LnPro
          </Badge>
        );
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredHierarchy = filterHierarchy(hierarchy, searchQuery);

  // Renderizar fila compacta del líder
  const renderLeaderRow = (leader: LeaderHierarchyNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(leader.id);
    const hasChildren = leader.children.length > 0;
    const bgColors = ['bg-yellow-50 hover:bg-yellow-100', 'bg-purple-50 hover:bg-purple-100', 'bg-green-50 hover:bg-green-100'];
    const borderColors = ['border-l-yellow-400', 'border-l-purple-400', 'border-l-green-400'];

    return (
      <div key={leader.id}>
        <div
          className={`flex items-center gap-3 p-3 ${bgColors[level] || 'bg-gray-50'} border-l-4 ${borderColors[level] || 'border-l-gray-400'} rounded-r-lg mb-2 transition-colors`}
          style={{ marginLeft: `${level * 1.5}rem` }}
        >
          {/* Expand/Collapse button */}
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(leader.id)}
              className="p-1 hover:bg-white/50 rounded flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              )}
            </button>
          ) : (
            <div className="w-6 flex-shrink-0" />
          )}

          {/* Nombre */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 truncate">{leader.nombre_completo}</span>
              {getRoleBadge(leader.role)}
              {!leader.is_active && (
                <Badge variant="destructive" className="text-xs">Inactivo</Badge>
              )}
            </div>
          </div>

          {/* Cédula */}
          <div className="flex items-center gap-1 text-sm text-gray-600 w-32 flex-shrink-0">
            <FileText className="h-4 w-4" />
            <span>{leader.cedula}</span>
          </div>

          {/* ADN */}
          <div className="w-24 flex-shrink-0">
            {leader.adn_type === 'linea' ? (
              <Badge className="bg-blue-100 text-blue-700 text-xs">
                <Layers className="h-3 w-3 mr-1" />
                Líneas
              </Badge>
            ) : leader.adn_type === 'ok' ? (
              <Badge className="bg-green-100 text-green-700 text-xs">
                <GitBranch className="h-3 w-3 mr-1" />
                OKs
              </Badge>
            ) : (
              <span className="text-xs text-gray-400">Sin ADN</span>
            )}
          </div>

          {/* Entidad (Líneas u OKs asignados) */}
          <div className="w-40 flex-shrink-0">
            <div className="flex flex-wrap gap-1">
              {leader.lineas?.map((l) => (
                <Badge
                  key={l.id}
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: l.color || '#3B82F6', color: l.color || '#3B82F6' }}
                >
                  {l.nombre}
                </Badge>
              ))}
              {leader.oks?.map((o) => (
                <Badge
                  key={o.id}
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: o.color || '#10B981', color: o.color || '#10B981' }}
                >
                  {o.nombre}
                </Badge>
              ))}
              {!leader.lineas?.length && !leader.oks?.length && (
                <span className="text-xs text-gray-400">-</span>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDetailModal(leader)}
              title="Ver detalles"
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={leader.is_active ? 'outline' : 'default'}
              onClick={() => handleToggleActive(leader.id)}
              disabled={toggling === leader.id}
              title={leader.is_active ? 'Desactivar' : 'Activar'}
              className="h-8 w-8 p-0"
            >
              {toggling === leader.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : leader.is_active ? (
                <PowerOff className="h-4 w-4" />
              ) : (
                <Power className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Hijos/Sub-líderes */}
        {isExpanded && hasChildren && (
          <div>
            {leader.children.map((child) => renderLeaderRow(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Modal de detalles
  const DetailModal = ({ leader, onClose }: { leader: LeaderHierarchyNode; onClose: () => void }) => {
    const bgColor = leader.role === 'leader_papa'
      ? 'bg-yellow-50'
      : leader.role === 'leader_hijo'
        ? 'bg-purple-50'
        : 'bg-green-50';

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className={`bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden`}>
          {/* Header */}
          <div className={`${bgColor} p-4 border-b flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              {leader.role === 'leader_papa' && <Crown className="h-6 w-6 text-yellow-600" />}
              {leader.role === 'leader_hijo' && <UserCheck className="h-6 w-6 text-purple-600" />}
              {leader.role === 'leader_lnpro' && <User className="h-6 w-6 text-green-600" />}
              <div>
                <h2 className="text-xl font-bold text-gray-900">{leader.nombre_completo}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {getRoleBadge(leader.role)}
                  {leader.is_active ? (
                    <Badge variant="default" className="text-xs">Activo</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">Inactivo</Badge>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Información Personal */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Información Personal
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">Primer Nombre:</span>
                  <p className="font-medium">{leader.primer_nombre || '-'}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">Segundo Nombre:</span>
                  <p className="font-medium">{leader.segundo_nombre || '-'}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">Primer Apellido:</span>
                  <p className="font-medium">{leader.primer_apellido || '-'}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">Segundo Apellido:</span>
                  <p className="font-medium">{leader.segundo_apellido || '-'}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">Cédula:</span>
                  <p className="font-medium">{leader.cedula}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">Celular:</span>
                  <p className="font-medium flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {leader.celular}
                  </p>
                </div>
                <div className="bg-gray-50 p-2 rounded col-span-2">
                  <span className="text-gray-500">Email:</span>
                  <p className="font-medium flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {leader.email || 'Sin email'}
                  </p>
                </div>
                <div className="bg-gray-50 p-2 rounded col-span-2">
                  <span className="text-gray-500">Barrio:</span>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {leader.barrio}
                  </p>
                </div>
              </div>
            </div>

            {/* Información de Votación */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Building className="h-4 w-4" />
                Información de Votación
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">Departamento:</span>
                  <p className="font-medium">{leader.departamento_votacion}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">Municipio:</span>
                  <p className="font-medium">{leader.municipio_votacion}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">Puesto de Votación:</span>
                  <p className="font-medium">{leader.puesto_votacion}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">Mesa:</span>
                  <p className="font-medium">{leader.mesa_votacion}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded col-span-2">
                  <span className="text-gray-500">Dirección de Votación:</span>
                  <p className="font-medium">{leader.direccion_votacion}</p>
                </div>
              </div>
            </div>

            {/* ADN */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                ADN Asignado
              </h3>
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-500">Tipo:</span>
                  {leader.adn_type === 'linea' ? (
                    <Badge className="bg-blue-100 text-blue-700">Líneas</Badge>
                  ) : leader.adn_type === 'ok' ? (
                    <Badge className="bg-green-100 text-green-700">OKs</Badge>
                  ) : (
                    <span className="text-gray-400">Sin asignar</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {leader.lineas?.map((l) => (
                    <Badge
                      key={l.id}
                      variant="outline"
                      style={{ borderColor: l.color || '#3B82F6', color: l.color || '#3B82F6' }}
                    >
                      {l.nombre}
                    </Badge>
                  ))}
                  {leader.oks?.map((o) => (
                    <Badge
                      key={o.id}
                      variant="outline"
                      style={{ borderColor: o.color || '#10B981', color: o.color || '#10B981' }}
                    >
                      {o.nombre}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Códigos de Referido */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Códigos de Referido
              </h3>
              <div className="space-y-2">
                <div className="bg-blue-50 p-3 rounded flex items-center justify-between">
                  <div>
                    <span className="text-xs text-blue-600 font-medium">Link para Nietos (Miembros)</span>
                    <p className="font-mono text-sm">{leader.referral_code}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(`${window.location.origin}/registro/${leader.referral_code}`, `nietos-${leader.id}`)}
                    className="h-8"
                  >
                    {copiedCode === `nietos-${leader.id}` ? (
                      <><Check className="h-4 w-4 mr-1" /> Copiado</>
                    ) : (
                      <><Copy className="h-4 w-4 mr-1" /> Copiar Link</>
                    )}
                  </Button>
                </div>
                {leader.leader_referral_code && (
                  <div className="bg-purple-50 p-3 rounded flex items-center justify-between">
                    <div>
                      <span className="text-xs text-purple-600 font-medium">Link para Sub-líderes</span>
                      <p className="font-mono text-sm">{leader.leader_referral_code}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(`${window.location.origin}/registro-lider/${leader.leader_referral_code}`, `subleaders-${leader.id}`)}
                      className="h-8"
                    >
                      {copiedCode === `subleaders-${leader.id}` ? (
                        <><Check className="h-4 w-4 mr-1" /> Copiado</>
                      ) : (
                        <><Copy className="h-4 w-4 mr-1" /> Copiar Link</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Estadísticas */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Network className="h-4 w-4" />
                Estadísticas de Red
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 p-3 rounded text-center">
                  <p className="text-2xl font-bold text-blue-700">{leader.direct_referrals_count}</p>
                  <p className="text-xs text-blue-600">Referidos Directos</p>
                </div>
                <div className="bg-purple-50 p-3 rounded text-center">
                  <p className="text-2xl font-bold text-purple-700">{leader.total_network_count}</p>
                  <p className="text-xs text-purple-600">Red Total</p>
                </div>
                {(leader.role === 'leader_papa' || leader.role === 'leader_hijo') && (
                  <>
                    <div className="bg-green-50 p-3 rounded text-center">
                      <p className="text-2xl font-bold text-green-700">{leader.direct_subleaders_count}</p>
                      <p className="text-xs text-green-600">Sub-líderes</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded text-center">
                      <p className="text-2xl font-bold text-orange-700">{leader.total_network_members_count}</p>
                      <p className="text-xs text-orange-600">Red Acumulada</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Observaciones */}
            {leader.observaciones && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Observaciones
                </h3>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-700">{leader.observaciones}</p>
                </div>
              </div>
            )}

            {/* Fecha de registro */}
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Registrado: {formatDate(leader.created_at)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Crown className="h-7 w-7 text-yellow-500" />
          Jerarquía de Líderes
        </h1>
        <p className="text-gray-600 mt-1">
          Vista completa de todos los líderes con sus sub-líderes
        </p>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700">
                Líderes Papá
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-800">{stats.total_papas}</div>
              <p className="text-xs text-yellow-600">
                {stats.active_papas} activos, {stats.inactive_papas} inactivos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">
                Hijos Mayor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-800">{stats.total_hijos}</div>
              <p className="text-xs text-purple-600">Sub-líderes nivel 2</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700">
                LnPro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800">{stats.total_lnpros}</div>
              <p className="text-xs text-green-600">Sub-líderes nivel 3</p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">
                Promedio Red
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">
                {Math.round(stats.average_network_members || 0)}
              </div>
              <p className="text-xs text-blue-600">Miembros por líder</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controles */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cédula, nombre o celular..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={expandAll}>
                Expandir Todo
              </Button>
              <Button variant="outline" onClick={collapseAll}>
                Colapsar Todo
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabla de cabeceras */}
      <div className="hidden md:flex items-center gap-3 px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-600">
        <div className="w-6 flex-shrink-0"></div>
        <div className="flex-1">Nombre</div>
        <div className="w-32 flex-shrink-0">Cédula</div>
        <div className="w-24 flex-shrink-0">ADN</div>
        <div className="w-40 flex-shrink-0">Entidad</div>
        <div className="w-20 flex-shrink-0 text-center">Acciones</div>
      </div>

      {/* Jerarquía */}
      <div className="space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredHierarchy.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {searchQuery ? 'No se encontraron líderes con esa búsqueda' : 'No hay líderes jerárquicos registrados'}
            </CardContent>
          </Card>
        ) : (
          filteredHierarchy.map((papa) => renderLeaderRow(papa, 0))
        )}
      </div>

      {/* Modal de detalles */}
      {detailModal && (
        <DetailModal leader={detailModal} onClose={() => setDetailModal(null)} />
      )}
    </div>
  );
};
