import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { CheckCircle2, AlertCircle, Loader2, Crown, UserCheck, User, Shield } from 'lucide-react';
import { departamentos, municipiosPorDepartamento } from '../data/colombia';
import api from '../services/api';

interface LeaderInfo {
  id: number;
  nombre_completo: string;
  role: string;
  adn_type: string | null;
}

export const PublicSubleaderRegisterPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();

  const [leader, setLeader] = useState<LeaderInfo | null>(null);
  const [subleaderType, setSubleaderType] = useState<string>('');
  const [subleaderLabel, setSubleaderLabel] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newUserInfo, setNewUserInfo] = useState<{ referral_code: string; leader_referral_code: string } | null>(null);

  const [formData, setFormData] = useState({
    cedula: '',
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    email: '',
    password: '',
    password_confirmation: '',
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
    loadLeader();
  }, [code]);

  const loadLeader = async () => {
    if (!code) {
      setError('No se proporcionó un código de líder');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/public/leader/${code}`);
      setLeader(response.data.leader);
      setSubleaderType(response.data.subleader_type);
      setSubleaderLabel(response.data.subleader_label);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Código de líder inválido');
      setLeader(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'departamento_votacion') {
      setFormData(prev => ({ ...prev, municipio_votacion: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!leader || !code) return;

    if (formData.password !== formData.password_confirmation) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await api.post('/public/register-subleader', {
        ...formData,
        leader_code: code,
      });

      setNewUserInfo({
        referral_code: response.data.user.referral_code,
        leader_referral_code: response.data.user.leader_referral_code,
      });
      setSuccess(true);
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.errors) {
        const errors = Object.values(errorData.errors).flat().join(', ');
        setError(errors);
      } else {
        setError(errorData?.error || 'Error al registrarse');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'leader_papa':
        return <Crown className="h-6 w-6 text-yellow-600" />;
      case 'leader_hijo':
        return <UserCheck className="h-6 w-6 text-purple-600" />;
      default:
        return <User className="h-6 w-6 text-blue-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'leader_papa':
        return 'Líder Papá';
      case 'leader_hijo':
        return 'Hijo Mayor';
      case 'leader_lnpro':
        return 'LnPro';
      default:
        return 'Líder';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-yellow-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !leader) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-yellow-50 flex items-center justify-center p-4">
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

  if (success && newUserInfo) {
    const shareUrlMembers = `${window.location.origin}/registro/${newUserInfo.referral_code}`;
    const shareUrlSubleaders = newUserInfo.leader_referral_code
      ? `${window.location.origin}/registro-lider/${newUserInfo.leader_referral_code}`
      : null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-yellow-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">¡Registro Exitoso!</CardTitle>
            <CardDescription>
              Te has registrado como {subleaderLabel} en la red de {leader?.nombre_completo}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Código para referir miembros */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Tu Código para Referir Miembros
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Comparte este link para que personas se registren como miembros de tu red:
              </p>
              <div className="bg-white p-4 rounded border border-blue-300 mb-3">
                <p className="text-center font-mono font-bold text-2xl text-blue-700">
                  {newUserInfo.referral_code}
                </p>
              </div>
              <div className="bg-white p-3 rounded border border-blue-300">
                <p className="text-sm text-muted-foreground mb-1">Link para compartir:</p>
                <p className="text-xs font-mono break-all text-blue-600">
                  {shareUrlMembers}
                </p>
              </div>
            </div>

            {/* Código para referir sub-líderes (si aplica) */}
            {shareUrlSubleaders && (
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  Tu Código para Crear Sub-líderes
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Comparte este link para que otros se registren como tus sub-líderes:
                </p>
                <div className="bg-white p-4 rounded border border-purple-300 mb-3">
                  <p className="text-center font-mono font-bold text-2xl text-purple-700">
                    {newUserInfo.leader_referral_code}
                  </p>
                </div>
                <div className="bg-white p-3 rounded border border-purple-300">
                  <p className="text-sm text-muted-foreground mb-1">Link para compartir:</p>
                  <p className="text-xs font-mono break-all text-purple-600">
                    {shareUrlSubleaders}
                  </p>
                </div>
              </div>
            )}

            <Alert>
              <AlertDescription>
                <strong>Importante:</strong> Guarda estos códigos y links. Ahora puedes iniciar sesión
                con tu email y contraseña para acceder a tu panel de líder.
              </AlertDescription>
            </Alert>

            <div className="flex justify-center">
              <Button onClick={() => window.location.href = '/login'}>
                Ir a Iniciar Sesión
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-yellow-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Leader Info */}
        {leader && (
          <Card className="mb-6 border-2 border-yellow-200 bg-yellow-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-3 rounded-full">
                  {getRoleIcon(leader.role)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Te está invitando</p>
                  <p className="font-semibold text-lg">{leader.nombre_completo}</p>
                  <p className="text-sm text-muted-foreground">{getRoleLabel(leader.role)}</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white rounded-lg border">
                <p className="text-sm">
                  Te registrarás como: <strong className="text-purple-700">{subleaderLabel}</strong>
                </p>
                {leader.adn_type && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Heredarás el ADN ({leader.adn_type === 'linea' ? 'Líneas' : 'OKs'}) de tu líder
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              Registro de {subleaderLabel}
            </CardTitle>
            <CardDescription>
              Completa el formulario para unirte como sub-líder
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

              {/* Credenciales */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Credenciales de Acceso
                </h3>
                <p className="text-sm text-muted-foreground">
                  Estas credenciales te permitirán acceder al sistema como líder
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Contraseña *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="password_confirmation">Confirmar Contraseña *</Label>
                    <Input
                      id="password_confirmation"
                      name="password_confirmation"
                      type="password"
                      value={formData.password_confirmation}
                      onChange={handleChange}
                      required
                      minLength={6}
                      placeholder="Repite tu contraseña"
                    />
                  </div>
                </div>
              </div>

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
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  `Registrarme como ${subleaderLabel}`
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
