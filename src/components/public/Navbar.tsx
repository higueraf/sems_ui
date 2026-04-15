import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, FlaskConical } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const navLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/pautas', label: 'Pautas' },
  { to: '/organizadores', label: 'Organizadores' },
  { to: '/agenda', label: 'Agenda' },
  { to: '/simposios', label: 'Simposios' },
  { to: '/talleres', label: 'Talleres' },
  { to: '/verificar', label: 'Verificar' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isDark } = useTheme(); // Solo para compatibilidad con estilos

  return (
    <>
      {/* ── Barra institucional superior ───────────────────────────────── */}
      <div className="bg-primary-900 text-white text-[11px] py-1.5 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <span>
            II Simposio Internacional de Ciencia Abierta · Cartagena de Indias, Colombia · 18–22 Mayo 2026
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-50 font-body bg-primary-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center border border-primary-700 shadow-lg">
              <span className="font-heading font-black text-white text-lg">CA</span>
            </div>
            <div>
              <div className="font-heading font-black text-white text-sm leading-tight">
                SIMPOSIO INTERNACIONAL
              </div>
              <div className="text-primary-200 text-[11px] font-semibold">
                DE CIENCIA ABIERTA 2026
              </div>
            </div>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-4 h-full flex items-center text-xs font-medium uppercase tracking-wide transition-colors ${
                    isActive
                      ? 'text-white font-bold border-b-2 border-yellow-400'
                      : 'text-primary-200 hover:text-white hover:bg-primary-600/20 px-3 py-1 rounded'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop: right side actions (CTA only) */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/postular"
              className="font-bold text-sm px-5 py-2.5 rounded-lg transition-all shadow-md bg-primary-700 hover:bg-primary-600 text-white shadow-primary-900/20"
            >
              Postular Trabajo
            </Link>
          </div>

          {/* Mobile: hamburger only */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg transition-colors hover:bg-white/20 text-white font-bold"
            >
              {isOpen
                ? <X size={26} strokeWidth={2.5} className="text-white" />
                : <Menu size={26} strokeWidth={2.5} className="text-white" />
              }
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden border-t border-primary-600/20 bg-primary-700">
            <div className="px-2 py-3 space-y-1">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm font-bold transition-colors text-white hover:bg-primary-600"
                >
                  {label}
                </Link>
              ))}
              <Link
                to="/postular"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 mt-2 bg-primary-600 text-white rounded-md font-bold text-sm text-center hover:bg-primary-500 transition-colors"
              >
                Postular Trabajo
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
    </>
  );
}
