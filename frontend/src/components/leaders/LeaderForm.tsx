import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { leaderService } from '../../services/leader.service';
import { lineaService } from '../../services/linea.service';
import { okService } from '../../services/ok.service';
import { departamentos, getMunicipiosByDepartamento } from '../../data/colombia';
import type { LeaderFormData, Linea, Ok, AdnType } from '../../types';
import { UserCog, Loader2, Layers, GitBranch, X } from 'lucide-react';

interface LeaderFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const LeaderForm: React.FC<LeaderFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<LeaderFormData>({
    cedula: '',
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    email: '',
    password: '',
    celular: '',
    barrio: '',
    departamento_votacion: '',
    municipio_votacion: '',
    puesto_votacion: '',
    direccion_votacion: '',
    mesa_votacion: '',
    observaciones: '',
    adn_type: null,
    linea_ids: [],
    ok_ids: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Opciones de ADN
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [oks, setOks] = useState<Ok[]>([]);
  const [loadingAdn, setLoadingAdn] = useState(false);

  const municipios = getMunicipiosByDepartamento(formData.departamento_votacion);

  // Cargar opciones de ADN al montar
  useEffect(() => {
    const loadAdnOptions = async () => {
      setLoadingAdn(true);
      try {
        const [lineasData, oksData] = await Promise.all([
          lineaService.getActiveLineas(),
          okService.getActiveOks(),
        ]);
        setLineas(lineasData);
        setOks(oksData);
      } catch (error) {
        console.error('Error al cargar opciones ADN:', error);
      } finally {
        setLoadingAdn(false);
      }
    };
    loadAdnOptions();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'departamento_votacion' ? { municipio_votacion: '' } : {}),
    }));
  };

  const handleAdnTypeChange = (type: AdnType) => {
    setFormData((prev) => ({
      ...prev,
      adn_type: type,
      linea_ids: type === 'linea' ? prev.linea_ids : [],
      ok_ids: type === 'ok' ? prev.ok_ids : [],
    }));
  };

  const handleLineaToggle = (lineaId: number) => {
    setFormData((prev) => {
      const currentIds = prev.linea_ids || [];
      const newIds = currentIds.includes(lineaId)
        ? currentIds.filter((id) => id !== lineaId)
        : [...currentIds, lineaId];
      return { ...prev, linea_ids: newIds };
    });
  };

  const handleOkToggle = (okId: number) => {
    setFormData((prev) => {
      const currentIds = prev.ok_ids || [];
      const newIds = currentIds.includes(okId)
        ? currentIds.filter((id) => id !== okId)
        : [...currentIds, okId];
      return { ...prev, ok_ids: newIds };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await leaderService.createLeader(formData);
      setSuccess(true);

      // Reset form
      setFormData({
        cedula: '',
        primer_nombre: '',
        segundo_nombre: '',
        primer_apellido: '',
        segundo_apellido: '',
        email: '',
        password: '',
        celular: '',
        barrio: '',
        departamento_votacion: '',
        municipio_votacion: '',
        puesto_votacion: '',
        direccion_votacion: '',
        mesa_votacion: '',
        observaciones: '',
        adn_type: null,
        linea_ids: [],
        ok_ids: [],
      });

      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; error?: string; errors?: Record<string, string[]> } } };
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.errors;

      if (typeof errorMessage === 'object' && errorMessage !== null) {
        const errors = Object.values(errorMessage).flat().join(', ');
        setError(errors);
      } else {
        setError(errorMessage || 'Error al crear el líder');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          <CardTitle>Crear Nuevo Líder</CardTitle>
        </div>
        <CardDescription>
          Los líderes tienen acceso al sistema y pueden gestionar su propia red
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-200">
              Líder creado exitosamente
            </div>
          )}

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}

          {/* Credenciales */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Credenciales de Acceso</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="lider@ejemplo.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Información Personal - Nombres separados */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Información Personal</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cedula">Cédula *</Label>
                <Input
                  id="cedula"
                  name="cedula"
                  value={formData.cedula}
                  onChange={handleChange}
                  placeholder="1234567890"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="celular">Celular *</Label>
                <Input
                  id="celular"
                  name="celular"
                  value={formData.celular}
                  onChange={handleChange}
                  placeholder="3001234567"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primer_nombre">Primer Nombre *</Label>
                <Input
                  id="primer_nombre"
                  name="primer_nombre"
                  value={formData.primer_nombre}
                  onChange={handleChange}
                  placeholder="Juan"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="segundo_nombre">Segundo Nombre</Label>
                <Input
                  id="segundo_nombre"
                  name="segundo_nombre"
                  value={formData.segundo_nombre || ''}
                  onChange={handleChange}
                  placeholder="Carlos"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primer_apellido">Primer Apellido *</Label>
                <Input
                  id="primer_apellido"
                  name="primer_apellido"
                  value={formData.primer_apellido}
                  onChange={handleChange}
                  placeholder="Pérez"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="segundo_apellido">Segundo Apellido *</Label>
                <Input
                  id="segundo_apellido"
                  name="segundo_apellido"
                  value={formData.segundo_apellido}
                  onChange={handleChange}
                  placeholder="García"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="barrio">Barrio *</Label>
                <Input
                  id="barrio"
                  name="barrio"
                  value={formData.barrio}
                  onChange={handleChange}
                  placeholder="Centro"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Clasificación ADN */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Clasificación ADN</h3>
            <p className="text-xs text-gray-500">
              Selecciona el tipo de clasificación (opcional). Un líder puede pertenecer a Líneas O a OKs, pero no a ambos.
            </p>

            {/* Radio buttons para tipo */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="adn_type"
                  checked={formData.adn_type === null}
                  onChange={() => handleAdnTypeChange(null)}
                  disabled={loading}
                  className="w-4 h-4 text-gray-600"
                />
                <span className="text-sm">Sin ADN</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="adn_type"
                  checked={formData.adn_type === 'linea'}
                  onChange={() => handleAdnTypeChange('linea')}
                  disabled={loading || lineas.length === 0}
                  className="w-4 h-4 text-blue-600"
                />
                <Layers className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Líneas</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="adn_type"
                  checked={formData.adn_type === 'ok'}
                  onChange={() => handleAdnTypeChange('ok')}
                  disabled={loading || oks.length === 0}
                  className="w-4 h-4 text-green-600"
                />
                <GitBranch className="h-4 w-4 text-green-600" />
                <span className="text-sm">OKs</span>
              </label>
            </div>

            {/* Selector de Líneas */}
            {formData.adn_type === 'linea' && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Label className="text-blue-800 mb-2 block">Selecciona Líneas:</Label>
                {loadingAdn ? (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando...
                  </div>
                ) : lineas.length === 0 ? (
                  <p className="text-sm text-blue-600">No hay líneas disponibles</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {lineas.map((linea) => {
                      const isSelected = formData.linea_ids?.includes(linea.id);
                      return (
                        <button
                          key={linea.id}
                          type="button"
                          onClick={() => handleLineaToggle(linea.id)}
                          disabled={loading}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: linea.color || '#3B82F6' }}
                          />
                          {linea.nombre}
                          {isSelected && <X className="h-3 w-3" />}
                        </button>
                      );
                    })}
                  </div>
                )}
                {(formData.linea_ids?.length || 0) > 0 && (
                  <p className="text-xs text-blue-600 mt-2">
                    {formData.linea_ids?.length} línea(s) seleccionada(s)
                  </p>
                )}
              </div>
            )}

            {/* Selector de OKs */}
            {formData.adn_type === 'ok' && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <Label className="text-green-800 mb-2 block">Selecciona OKs:</Label>
                {loadingAdn ? (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando...
                  </div>
                ) : oks.length === 0 ? (
                  <p className="text-sm text-green-600">No hay OKs disponibles</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {oks.map((ok) => {
                      const isSelected = formData.ok_ids?.includes(ok.id);
                      return (
                        <button
                          key={ok.id}
                          type="button"
                          onClick={() => handleOkToggle(ok.id)}
                          disabled={loading}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            isSelected
                              ? 'bg-green-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: ok.color || '#10B981' }}
                          />
                          {ok.nombre}
                          {isSelected && <X className="h-3 w-3" />}
                        </button>
                      );
                    })}
                  </div>
                )}
                {(formData.ok_ids?.length || 0) > 0 && (
                  <p className="text-xs text-green-600 mt-2">
                    {formData.ok_ids?.length} OK(s) seleccionado(s)
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Información de Votación */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Información de Votación</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="departamento_votacion">Departamento *</Label>
                <select
                  id="departamento_votacion"
                  name="departamento_votacion"
                  value={formData.departamento_votacion}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Seleccione...</option>
                  {departamentos.map((dept) => (
                    <option key={dept.codigo} value={dept.codigo}>
                      {dept.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="municipio_votacion">Municipio *</Label>
                <select
                  id="municipio_votacion"
                  name="municipio_votacion"
                  value={formData.municipio_votacion}
                  onChange={handleChange}
                  required
                  disabled={loading || !formData.departamento_votacion}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Seleccione...</option>
                  {municipios.map((mun) => (
                    <option key={mun.codigo} value={mun.nombre}>
                      {mun.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="puesto_votacion">Puesto de Votación *</Label>
                <Input
                  id="puesto_votacion"
                  name="puesto_votacion"
                  value={formData.puesto_votacion}
                  onChange={handleChange}
                  placeholder="Colegio San José"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mesa_votacion">Mesa de Votación *</Label>
                <Input
                  id="mesa_votacion"
                  name="mesa_votacion"
                  value={formData.mesa_votacion}
                  onChange={handleChange}
                  placeholder="123"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="direccion_votacion">Dirección del Puesto *</Label>
                <Input
                  id="direccion_votacion"
                  name="direccion_votacion"
                  value={formData.direccion_votacion}
                  onChange={handleChange}
                  placeholder="Calle 123 #45-67"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones (Opcional)</Label>
            <Textarea
              id="observaciones"
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              placeholder="Notas adicionales..."
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <UserCog className="mr-2 h-4 w-4" />
                  Crear Líder
                </>
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
