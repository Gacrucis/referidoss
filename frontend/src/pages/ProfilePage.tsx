import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { User, Mail, MapPin, Shield, Key, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, isSuperAdmin, isLeader } = useAuth();

  // Estado para edición de perfil
  const [profileData, setProfileData] = useState({
    nombre_completo: user?.nombre_completo || '',
    email: user?.email || '',
    celular: user?.celular || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Estado para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    setProfileSuccess(false);
    setProfileError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setPasswordSuccess(false);
    setPasswordError(null);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      await authService.updateProfile(profileData);
      setProfileSuccess(true);
      // Recargar la página para actualizar el contexto
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.errors || 'Error al actualizar perfil';
      if (typeof message === 'object') {
        setProfileError(Object.values(message).flat().join(', '));
      } else {
        setProfileError(message);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      setPasswordError('Las contraseñas no coinciden');
      setPasswordLoading(false);
      return;
    }

    if (passwordData.new_password.length < 8) {
      setPasswordError('La nueva contraseña debe tener al menos 8 caracteres');
      setPasswordLoading(false);
      return;
    }

    try {
      await authService.changePassword(passwordData);
      setPasswordSuccess(true);
      setPasswordData({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.errors || 'Error al cambiar contraseña';
      if (typeof message === 'object') {
        setPasswordError(Object.values(message).flat().join(', '));
      } else {
        setPasswordError(message);
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Administrador';
      case 'leader': return 'Líder';
      case 'member': return 'Miembro';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'leader': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona tu información personal y seguridad
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información del Usuario */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Tu información básica de cuenta</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge className={`${getRoleColor(user?.role || '')} border`}>
                <Shield className="h-3 w-3 mr-1" />
                {getRoleName(user?.role || '')}
              </Badge>
            </div>

            <Separator />

            <div className="grid gap-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Cédula</p>
                  <p className="font-medium">{user?.cedula}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Código de Referido</p>
                  <p className="font-mono font-bold text-primary">{user?.referral_code}</p>
                </div>
              </div>

              {!isSuperAdmin && (
                <>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Nivel en la Red</p>
                      <p className="font-medium">Nivel {user?.level}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-600">Referidos Directos</p>
                      <p className="text-2xl font-bold text-blue-700">{user?.direct_referrals_count || 0}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <p className="text-xs text-green-600">Red Total</p>
                      <p className="text-2xl font-bold text-green-700">{user?.total_network_count || 0}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Editar Perfil */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Editar Perfil</CardTitle>
                <CardDescription>Actualiza tu información de contacto</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {profileSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm">Perfil actualizado correctamente</span>
                </div>
              )}

              {profileError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{profileError}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="nombre_completo">Nombre Completo</Label>
                <Input
                  id="nombre_completo"
                  name="nombre_completo"
                  value={profileData.nombre_completo}
                  onChange={handleProfileChange}
                  disabled={profileLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  disabled={profileLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="celular">Celular</Label>
                <Input
                  id="celular"
                  name="celular"
                  value={profileData.celular}
                  onChange={handleProfileChange}
                  disabled={profileLoading}
                />
              </div>

              <Button type="submit" disabled={profileLoading} className="w-full">
                {profileLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Cambiar Contraseña - Solo para super admin y líderes */}
        {(isSuperAdmin || isLeader) && (
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-3 rounded-full">
                  <Key className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle>Cambiar Contraseña</CardTitle>
                  <CardDescription>Actualiza tu contraseña de acceso al sistema</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                {passwordSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm">Contraseña actualizada correctamente</span>
                  </div>
                )}

                {passwordError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{passwordError}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="current_password">Contraseña Actual</Label>
                  <Input
                    id="current_password"
                    name="current_password"
                    type="password"
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    disabled={passwordLoading}
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_password">Nueva Contraseña</Label>
                  <Input
                    id="new_password"
                    name="new_password"
                    type="password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    disabled={passwordLoading}
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-muted-foreground">Mínimo 8 caracteres</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_password_confirmation">Confirmar Nueva Contraseña</Label>
                  <Input
                    id="new_password_confirmation"
                    name="new_password_confirmation"
                    type="password"
                    value={passwordData.new_password_confirmation}
                    onChange={handlePasswordChange}
                    disabled={passwordLoading}
                    placeholder="••••••••"
                  />
                </div>

                <Button type="submit" variant="outline" disabled={passwordLoading}>
                  {passwordLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cambiando...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Cambiar Contraseña
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
