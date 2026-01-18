import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { leaderService } from '../../services/leader.service';
import { departamentos, getMunicipiosByDepartamento } from '../../data/colombia';
import type { LeaderFormData } from '../../types';
import { UserCog, Loader2 } from 'lucide-react';

interface LeaderFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const LeaderForm: React.FC<LeaderFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<LeaderFormData>({
    cedula: '',
    nombre_completo: '',
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
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const municipios = getMunicipiosByDepartamento(formData.departamento_votacion);

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
        nombre_completo: '',
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
      });

      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors ||
        'Error al crear el líder';

      if (typeof errorMessage === 'object') {
        const errors = Object.values(errorMessage).flat().join(', ');
        setError(errors);
      } else {
        setError(errorMessage);
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

          {/* Información Personal */}
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
                <Label htmlFor="nombre_completo">Nombre Completo *</Label>
                <Input
                  id="nombre_completo"
                  name="nombre_completo"
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  placeholder="Juan Pérez García"
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
