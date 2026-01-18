import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { User, Mail, Phone, Network, Calendar } from 'lucide-react';
import type { TreeNode } from '../../services/tree.service';

interface NodeDetailsProps {
  node: TreeNode | null;
}

export const NodeDetails: React.FC<NodeDetailsProps> = ({ node }) => {
  if (!node) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Nodo</CardTitle>
          <CardDescription>Selecciona un nodo en el árbol para ver sus detalles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <User className="h-12 w-12" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalles del Nodo</CardTitle>
        <CardDescription>Información completa del referido seleccionado</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nombre */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Información Personal</span>
          </div>
          <div className="pl-6 space-y-1">
            <p className="text-lg font-semibold">{node.nombre_completo}</p>
            <p className="text-sm text-muted-foreground">Cédula: {node.cedula}</p>
          </div>
        </div>

        {/* Contacto */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Contacto</span>
          </div>
          <div className="pl-6 space-y-1">
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3 text-muted-foreground" />
              <p className="text-sm">{node.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <p className="text-sm">{node.celular}</p>
            </div>
          </div>
        </div>

        {/* Red */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Network className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Red de Referidos</span>
          </div>
          <div className="pl-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Nivel en jerarquía:</span>
              <Badge variant="outline">Nivel {node.level}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Referidos directos:</span>
              <Badge variant="secondary">{node.direct_referrals_count}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Red total:</span>
              <Badge variant="default">{node.total_network_count}</Badge>
            </div>
          </div>
        </div>

        {/* Fecha */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Información Adicional</span>
          </div>
          <div className="pl-6 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Fecha de registro:</span>
              <span className="text-sm">{formatDate(node.created_at)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Path:</span>
              <span className="text-xs text-muted-foreground font-mono">{node.path}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
