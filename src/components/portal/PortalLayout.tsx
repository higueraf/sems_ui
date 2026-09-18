import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen, FileText, Layers, Award, UserCog, LogOut, Menu, X,
} from 'lucide-react';
import { eventsApi } from '../../api/events.api';
import { useAuthStore } from '../../store/auth.store';
import { formatEventDateRange } from '../../utils';

const NAV_ITEMS = [
  { to: '/portal', label: 'Postulación actual', icon: FileText, end: true },
  { to: '/portal/postulaciones', label: 'Mis postulaciones', icon: Layers, end: false },
  { to: '/portal/certificados', label: 'Mis certificados', icon: Award, end: false },
  { to: '/portal/cuenta', label: 'Mi cuenta', icon: UserCog, end: false },
];

export default function PortalLayout() {
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: event } = useQuery({ queryKey: ['event-active'], queryFn: eventsApi.getActive });
  const eventName = event?.name || 'III Simposio Internacional de Ciencia Abierta 2026';
  const eventDateRange = formatEventDateRange(event?.startDate, event?.endDate);

  const SidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/20">
            <BookOpen size={20} className="text-[#7ee8a2]" />
          </div>
          <div className="min-w-0">
            <p className="font-heading font-bold text-white text-sm leading-tight">Portal de Autores</p>
            <p className="text-[#a0d8b3] text-xs truncate">
              {eventName}{eventDateRange ? ` ${eventDateRange.year}` : ''}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#007F3A] text-white shadow-sm'
                  : 'text-[#a0d8b3] hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-3 py-2 mb-1">
          <p className="text-white text-sm font-semibold truncate">{user?.firstName} {user?.lastName}</p>
          <p className="text-[#a0d8b3] text-xs truncate">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#a0d8b3] hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut size={17} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-[#003918]">
        {SidebarContent}
      </aside>

      {/* Header + drawer mobile */}
      <div className="lg:hidden bg-[#003918] px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-[#7ee8a2]" />
          <span className="font-heading font-bold text-white text-sm">Portal de Autores</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="text-white p-1.5">
          <Menu size={22} />
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-72 bg-[#003918] flex flex-col">
            <div className="flex justify-end px-3 pt-3">
              <button onClick={() => setMobileOpen(false)} className="text-white p-1.5">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 -mt-3">{SidebarContent}</div>
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <main className="flex-1 min-w-0">
        <div className="max-w-4xl mx-auto px-4 py-8 lg:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
