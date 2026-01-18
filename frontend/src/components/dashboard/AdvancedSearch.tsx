import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Search, Download, X } from 'lucide-react';
import { departamentos, getMunicipiosByDepartamento } from '../../data/colombia';
import type { SearchFilters } from '../../types';

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onExport: () => void;
  loading?: boolean;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onExport,
  loading = false,
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    cedula: '',
    nombre: '',
    celular: '',
    departamento: '',
    municipio: '',
    barrio: '',
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const municipios = filters.departamento
    ? getMunicipiosByDepartamento(filters.departamento)
    : [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      // Reset municipio when departamento changes
      ...(name === 'departamento' ? { municipio: '' } : {}),
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter out empty values
    const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value && value.trim() !== '') {
        acc[key as keyof SearchFilters] = value;
      }
      return acc;
    }, {} as SearchFilters);

    onSearch(activeFilters);
  };

  const handleClear = () => {
    const emptyFilters = {
      cedula: '',
      nombre: '',
      celular: '',
      departamento: '',
      municipio: '',
      barrio: '',
    };
    setFilters(emptyFilters);
    onSearch({});
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Búsqueda Avanzada
            </CardTitle>
            <CardDescription>
              Filtra usuarios por cédula, nombre, ubicación y más
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Contraer' : 'Expandir'}
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onExport}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar a Excel
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Quick search - always visible */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cedula">Cédula</Label>
              <Input
                id="cedula"
                name="cedula"
                value={filters.cedula}
                onChange={handleChange}
                placeholder="Buscar por cédula..."
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                value={filters.nombre}
                onChange={handleChange}
                placeholder="Buscar por nombre..."
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="celular">Celular</Label>
              <Input
                id="celular"
                name="celular"
                value={filters.celular}
                onChange={handleChange}
                placeholder="Buscar por celular..."
                disabled={loading}
              />
            </div>
          </div>

          {/* Advanced filters - collapsible */}
          {isExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="departamento">Departamento</Label>
                <select
                  id="departamento"
                  name="departamento"
                  value={filters.departamento}
                  onChange={handleChange}
                  disabled={loading}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Todos los departamentos</option>
                  {departamentos.map((dept) => (
                    <option key={dept.codigo} value={dept.codigo}>
                      {dept.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="municipio">Municipio</Label>
                <select
                  id="municipio"
                  name="municipio"
                  value={filters.municipio}
                  onChange={handleChange}
                  disabled={loading || !filters.departamento}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Todos los municipios</option>
                  {municipios.map((mun) => (
                    <option key={mun.codigo} value={mun.nombre}>
                      {mun.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="barrio">Barrio</Label>
                <Input
                  id="barrio"
                  name="barrio"
                  value={filters.barrio}
                  onChange={handleChange}
                  placeholder="Buscar por barrio..."
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
            <Button type="submit" disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
