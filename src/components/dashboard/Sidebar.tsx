import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Calendar, Settings, Globe, Users, BookOpen,
  Sliders, LogOut, X, Tag, Layout, Cpu, ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { cn } from '../../utils';

const mainLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/postulaciones', label: 'Postulaciones', icon: FileText },
  { to: '/dashboard/agenda', label: 'Agenda', icon: Calendar },
];

const adminLinks = [
  { to: '/dashboard/eventos', label: 'Eventos', icon: Settings },
  { to: '/dashboard/ejes-tematicos', label: 'Ejes Temáticos', icon: Tag },
  { to: '/dashboard/tipos-producto', label: 'Tipos de Producto', icon: Cpu },
  { to: '/dashboard/organizadores', label: 'Organizadores', icon: Users },
  { to: '/dashboard/paises', label: 'Países', icon: Globe },
  { to: '/dashboard/pautas', label: 'Pautas', icon: BookOpen },
  { to: '/dashboard/contenido', label: 'Contenido Web', icon: Layout },
  { to: '/dashboard/usuarios', label: 'Usuarios', icon: Users },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/dashboard/login');
  };

  return (
    <aside
      className={cn(
        'fixed md:static inset-y-0 left-0 z-30 w-64 bg-gray-900 flex flex-col transition-transform duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <span className="font-heading font-bold text-white leading-tight block">SEMS</span>
            <span className="text-gray-400 text-xs">Dashboard</span>
          </div>
        </div>
        <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white p-1">
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {mainLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onClose}
            className={({ isActive }) =>
              cn('sidebar-link', isActive ? 'sidebar-link-active' : 'sidebar-link-inactive')
            }
          >
            <link.icon size={18} />
            {link.label}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <>
            <div className="pt-4 pb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4">
                Administración
              </p>
            </div>
            {adminLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn('sidebar-link', isActive ? 'sidebar-link-active' : 'sidebar-link-inactive')
                }
              >
                <link.icon size={18} />
                {link.label}
              </NavLink>
            ))}
          </>
        )}

        <div className="pt-4 pb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4">Sitio Público</p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-link sidebar-link-inactive"
        >
          <ExternalLink size={18} />
          Ver Sitio Público
        </a>
      </nav>

      {/* User */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-gray-400 text-xs capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg px-3 py-2 text-sm transition-colors"
        >
          <LogOut size={16} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
