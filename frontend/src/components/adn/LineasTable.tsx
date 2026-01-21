import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit2, Trash2, Users, Power, PowerOff, Eye, Network } from 'lucide-react';
import type { Linea, PaginatedResponse } from '../../types';

interface LineasTableProps {
  lineas: PaginatedResponse<Linea> | null;
  loading: boolean;
  onEdit: (linea: Linea) => void;
  onDelete: (linea: Linea) => void;
  onToggleActive: (linea: Linea) => void;
  onViewDetails: (linea: Linea) => void;
  onPageChange: (page: number) => void;
}

export const LineasTable: React.FC<LineasTableProps> = ({
  lineas,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
  onViewDetails,
  onPageChange,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!lineas || lineas.data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No hay líneas registradas
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Color
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Líderes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Red Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {lineas.data.map((linea) => (
              <tr key={linea.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-gray-200"
                    style={{ backgroundColor: linea.color || '#3B82F6' }}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{linea.nombre}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 max-w-xs truncate">
                    {linea.descripcion || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                    <Users className="h-3 w-3" />
                    {linea.leaders_count || 0}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant="outline" className="flex items-center gap-1 w-fit bg-blue-50 text-blue-700 border-blue-200">
                    <Network className="h-3 w-3" />
                    {linea.total_network || 0}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={linea.is_active ? 'default' : 'secondary'}>
                    {linea.is_active ? 'Activa' : 'Inactiva'}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(linea)}
                      title="Ver detalles"
                    >
                      <Eye className="h-4 w-4 text-purple-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleActive(linea)}
                      title={linea.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {linea.is_active ? (
                        <PowerOff className="h-4 w-4 text-orange-500" />
                      ) : (
                        <Power className="h-4 w-4 text-green-500" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(linea)}
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(linea)}
                      title="Eliminar"
                      disabled={(linea.leaders_count || 0) > 0}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {lineas.last_page > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(lineas.current_page - 1)}
              disabled={lineas.current_page === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(lineas.current_page + 1)}
              disabled={lineas.current_page === lineas.last_page}
            >
              Siguiente
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{lineas.from}</span> a{' '}
                <span className="font-medium">{lineas.to}</span> de{' '}
                <span className="font-medium">{lineas.total}</span> resultados
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(lineas.current_page - 1)}
                disabled={lineas.current_page === 1}
              >
                Anterior
              </Button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Página {lineas.current_page} de {lineas.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(lineas.current_page + 1)}
                disabled={lineas.current_page === lineas.last_page}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
