import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';
import { Separator } from '../ui/separator';
import {
  LayoutDashboard,
  Users,
  Network,
  UserCog,
  UserCircle,
  X,
  Settings,
} from 'lucide-react';
import { Button } from '../ui/button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
      roles: ['super_admin', 'leader', 'member'],
    },
    {
      title: 'Referidos',
      icon: Users,
      href: '/users',
      roles: ['super_admin', 'leader', 'member'],
    },
    {
      title: 'Árbol Jerárquico',
      icon: Network,
      href: '/tree',
      roles: ['super_admin', 'leader', 'member'],
    },
    {
      title: 'Gestion de Lideres',
      icon: UserCog,
      href: '/leaders',
      roles: ['super_admin'],
    },
    {
      title: 'Gestion de Usuarios',
      icon: Settings,
      href: '/admin/users',
      roles: ['super_admin', 'leader'],
    },
    {
      title: 'Mi Perfil',
      icon: UserCircle,
      href: '/profile',
      roles: ['super_admin', 'leader'],
    },
  ];

  const visibleMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-background border-r transition-transform duration-300 md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Mobile header */}
          <div className="flex h-16 items-center justify-between px-4 md:hidden border-b">
            <span className="font-semibold">Menú</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {visibleMenuItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </NavLink>
            ))}
          </nav>

          <Separator />

          {/* User stats */}
          <div className="p-4 space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Mi Red
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-accent p-2">
                <div className="text-xs text-muted-foreground">Directos</div>
                <div className="text-lg font-bold">
                  {user?.direct_referrals_count || 0}
                </div>
              </div>
              <div className="rounded-lg bg-accent p-2">
                <div className="text-xs text-muted-foreground">Red Total</div>
                <div className="text-lg font-bold">
                  {user?.total_network_count || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
