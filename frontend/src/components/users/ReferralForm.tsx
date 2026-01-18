import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { userService } from '../../services/user.service';
import { departamentos, getMunicipiosByDepartamento } from '../../data/colombia';
import type { ReferralFormData } from '../../types';
import { UserPlus, Loader2 } from 'lucide-react';

interface ReferralFormProps {
  onSuccess?: () => void;
}

export const ReferralForm: React.FC<ReferralFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<ReferralFormData>({
    cedula: '',
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
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
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralUrl, setReferralUrl] = useState<string>('');

  const municipios = getMunicipiosByDepartamento(formData.departamento_votacion);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Reset municipio when departamento changes
      ...(name === 'departamento_votacion' ? { municipio_votacion: '' } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await userService.createUser(formData) as any;
      setSuccess(true);
      setReferralCode(response.referral_code || response.user?.referral_code || '');
      setReferralUrl(response.referral_url || '');

      // Reset form
      setFormData({
        cedula: '',
        primer_nombre: '',
        segundo_nombre: '',
        primer_apellido: '',
        segundo_apellido: '',
        celular: '',
        barrio: '',
        departamento_votacion: '',
        municipio_votacion: '',
        puesto_votacion: '',
        direccion_votacion: '',
        mesa_votacion: '',
        observaciones: '',
      });

      // Call success callback after a delay to show the success message
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 5000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors ||
        'Error al crear el referido';

      // Format validation errors
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
          <UserPlus className="h-5 w-5" />
          <CardTitle>Registrar Nuevo Referido</CardTitle>
        </div>
        <CardDescription>
          Completa todos los campos para agregar un nuevo referido a tu red
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Success message */}
          {success && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-3">
              <p className="text-sm font-medium text-green-800">
                ✓ Referido creado exitosamente
              </p>
              {referralCode && (
                <div className="bg-white p-3 rounded border border-green-300">
                  <p className="text-xs text-green-700 font-medium mb-1">Código de Referido:</p>
                  <p className="font-mono font-bold text-lg text-green-900">{referralCode}</p>
                </div>
              )}
              {referralUrl && (
                <div className="bg-white p-3 rounded border border-green-300">
                  <p className="text-xs text-green-700 font-medium mb-1">Link para Compartir:</p>
                  <p className="font-mono text-xs text-green-900 break-all">{referralUrl}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-2 w-full"
                    onClick={() => navigator.clipboard.writeText(referralUrl)}
                  >
                    Copiar Link
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}

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
                  value={formData.segundo_nombre}
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
                <Label htmlFor="segundo_apellido">Segundo Apellido</Label>
                <Input
                  id="segundo_apellido"
                  name="segundo_apellido"
                  value={formData.segundo_apellido}
                  onChange={handleChange}
                  placeholder="García"
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

          {/* Submit Button */}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Registrar Referido
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
