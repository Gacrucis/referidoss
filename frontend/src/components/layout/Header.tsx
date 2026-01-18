import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { LogOut, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      super_admin: { label: 'Super Admin', variant: 'destructive' as const },
      leader: { label: 'Líder', variant: 'default' as const },
      member: { label: 'Miembro', variant: 'secondary' as const },
    };
    return badges[role as keyof typeof badges] || badges.member;
  };

  if (!user) return null;

  const roleBadge = getRoleBadge(user.role);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 gap-4">
        {/* Menu button for mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo/Title */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">SR</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold">Sistema de Referidos</h1>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-medium">{user.nombre_completo}</span>
            <div className="flex items-center gap-2">
              <Badge variant={roleBadge.variant} className="text-xs">
                {roleBadge.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Código: {user.referral_code}
              </span>
            </div>
          </div>

          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(user.nombre_completo)}
            </AvatarFallback>
          </Avatar>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
