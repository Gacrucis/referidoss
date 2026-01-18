import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { CheckCircle2, AlertCircle, Loader2, UserCheck } from 'lucide-react';
import { departamentos, municipiosPorDepartamento } from '../data/colombia';
import api from '../services/api';

interface ReferrerInfo {
  id: number;
  nombre_completo: string;
  cedula: string;
  referral_code: string;
}

export const PublicRegisterPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();

  const [referrer, setReferrer] = useState<ReferrerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newUserCode, setNewUserCode] = useState<string>('');

  const [formData, setFormData] = useState({
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

  useEffect(() => {
    loadReferrer();
  }, [code]);

  const loadReferrer = async () => {
    if (!code) {
      setError('No se proporcionó un código de referido');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/public/referrer/${code}`);
      setReferrer(response.data.referrer);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Código de referido inválido');
      setReferrer(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Reset municipio cuando cambia departamento
    if (name === 'departamento_votacion') {
      setFormData(prev => ({ ...prev, municipio_votacion: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!referrer) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await api.post('/public/register', {
        ...formData,
        referral_code: referrer.referral_code,
      });

      setNewUserCode(response.data.user.referral_code);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrarse');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !referrer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <CardTitle>Código Inválido</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    const shareUrl = `${window.location.origin}/register/${newUserCode}`;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">¡Registro Exitoso!</CardTitle>
            <CardDescription>
              Has sido registrado en la red de {referrer?.nombre_completo}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-600" />
                Tu Código de Referido
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Comparte este código o link para referir a otras personas:
              </p>
              <div className="bg-white p-4 rounded border border-blue-300 mb-3">
                <p className="text-center font-mono font-bold text-2xl text-blue-700">
                  {newUserCode}
                </p>
              </div>
              <div className="bg-white p-3 rounded border border-blue-300">
                <p className="text-sm text-muted-foreground mb-1">Link para compartir:</p>
                <p className="text-xs font-mono break-all text-blue-600">
                  {shareUrl}
                </p>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                Guarda este código y link. Puedes compartirlo por WhatsApp, SMS o redes sociales
                para que otras personas se registren bajo tu red.
              </AlertDescription>
            </Alert>

            <div className="flex justify-center">
              <Button
                onClick={() => window.location.href = shareUrl}
                variant="outline"
              >
                Copiar Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const municipios = formData.departamento_votacion
    ? municipiosPorDepartamento[formData.departamento_votacion] || []
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Referrer Info */}
        {referrer && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-full">
                  <UserCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Te está invitando</p>
                  <p className="font-semibold text-lg">{referrer.nombre_completo}</p>
                  <p className="text-sm text-muted-foreground">CC: {referrer.cedula}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Registro de Nuevo Miembro</CardTitle>
            <CardDescription>
              Completa el formulario para unirte a la red
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Información Personal */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Información Personal</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cedula">Cédula *</Label>
                    <Input
                      id="cedula"
                      name="cedula"
                      value={formData.cedula}
                      onChange={handleChange}
                      required
                      placeholder="1234567890"
                    />
                  </div>

                  <div>
                    <Label htmlFor="primer_nombre">Primer Nombre *</Label>
                    <Input
                      id="primer_nombre"
                      name="primer_nombre"
                      value={formData.primer_nombre}
                      onChange={handleChange}
                      required
                      placeholder="Juan"
                    />
                  </div>

                  <div>
                    <Label htmlFor="segundo_nombre">Segundo Nombre</Label>
                    <Input
                      id="segundo_nombre"
                      name="segundo_nombre"
                      value={formData.segundo_nombre}
                      onChange={handleChange}
                      placeholder="Carlos"
                    />
                  </div>

                  <div>
                    <Label htmlFor="primer_apellido">Primer Apellido *</Label>
                    <Input
                      id="primer_apellido"
                      name="primer_apellido"
                      value={formData.primer_apellido}
                      onChange={handleChange}
                      required
                      placeholder="Pérez"
                    />
                  </div>

                  <div>
                    <Label htmlFor="segundo_apellido">Segundo Apellido</Label>
                    <Input
                      id="segundo_apellido"
                      name="segundo_apellido"
                      value={formData.segundo_apellido}
                      onChange={handleChange}
                      placeholder="García"
                    />
                  </div>

                  <div>
                    <Label htmlFor="celular">Celular *</Label>
                    <Input
                      id="celular"
                      name="celular"
                      value={formData.celular}
                      onChange={handleChange}
                      required
                      placeholder="3001234567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="barrio">Barrio *</Label>
                    <Input
                      id="barrio"
                      name="barrio"
                      value={formData.barrio}
                      onChange={handleChange}
                      required
                      placeholder="Centro"
                    />
                  </div>
                </div>
              </div>

              {/* Información de Votación */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Información de Votación</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="departamento_votacion">Departamento *</Label>
                    <select
                      id="departamento_votacion"
                      name="departamento_votacion"
                      value={formData.departamento_votacion}
                      onChange={handleChange}
                      required
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Seleccione...</option>
                      {departamentos.map((dept) => (
                        <option key={dept.codigo} value={dept.codigo}>
                          {dept.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="municipio_votacion">Municipio *</Label>
                    <select
                      id="municipio_votacion"
                      name="municipio_votacion"
                      value={formData.municipio_votacion}
                      onChange={handleChange}
                      required
                      disabled={!formData.departamento_votacion}
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
                </div>

                <div>
                  <Label htmlFor="puesto_votacion">Puesto de Votación *</Label>
                  <Input
                    id="puesto_votacion"
                    name="puesto_votacion"
                    value={formData.puesto_votacion}
                    onChange={handleChange}
                    required
                    placeholder="Colegio San José"
                  />
                </div>

                <div>
                  <Label htmlFor="direccion_votacion">Dirección del Puesto *</Label>
                  <Input
                    id="direccion_votacion"
                    name="direccion_votacion"
                    value={formData.direccion_votacion}
                    onChange={handleChange}
                    required
                    placeholder="Calle 10 #20-30"
                  />
                </div>

                <div>
                  <Label htmlFor="mesa_votacion">Mesa de Votación *</Label>
                  <Input
                    id="mesa_votacion"
                    name="mesa_votacion"
                    value={formData.mesa_votacion}
                    onChange={handleChange}
                    required
                    placeholder="123"
                  />
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <Label htmlFor="observaciones">Observaciones (Opcional)</Label>
                <Input
                  id="observaciones"
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleChange}
                  placeholder="Notas adicionales..."
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  'Registrarse'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
