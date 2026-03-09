import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Sun, Moon, FlaskConical } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const navLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/pautas', label: 'Pautas' },
  { to: '/organizadores', label: 'Organizadores' },
  { to: '/agenda', label: 'Agenda' },
  { to: '/verificar', label: 'Verificar' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { toggle, isDark } = useTheme();

  return (
    <header className="sticky top-0 z-50 font-body">

      {/* ── LIGHT: Top institutional bar ───────────────────────────────── */}
      {!isDark && (
        <div className="bg-primary-900 text-primary-200 text-[11px] py-1.5 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <span>
              II Simposio Internacional de Ciencia Abierta · Cartagena de Indias, Colombia · 18–22 Mayo 2026
            </span>
            <button
              onClick={toggle}
              className="flex items-center gap-1 text-primary-300 hover:text-white transition-colors"
              title="Cambiar a modo oscuro"
            >
              <Moon size={12} />
              <span>Modo oscuro</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Main logo + brand row ───────────────────────────────────────── */}
      <div
        className={`border-b ${
          isDark
            ? 'bg-gray-950 border-white/10'
            : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                  isDark ? 'bg-primary-600' : 'bg-primary-700'
                }`}
              >
                <FlaskConical size={19} className="text-white" />
              </div>
              <div className="leading-none">
                <div
                  className={`font-heading font-extrabold text-base leading-tight ${
                    isDark ? 'text-white' : 'text-primary-900'
                  }`}
                >
                  Ciencia Abierta 2026
                </div>
                <div className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  II Simposio Internacional
                </div>
              </div>
            </Link>

            {/* Desktop: right side actions (theme toggle + CTA) */}
            <div className="hidden md:flex items-center gap-3">
              {isDark ? (
                <button
                  onClick={toggle}
                  className="p-2 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-400/10 transition-all"
                  title="Cambiar a modo claro"
                >
                  <Sun size={18} />
                </button>
              ) : null}
              <Link
                to="/postular"
                className={`font-bold text-sm px-5 py-2.5 rounded-lg transition-all shadow-md ${
                  isDark
                    ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-950/50'
                    : 'bg-primary-700 hover:bg-primary-600 text-white shadow-primary-900/20'
                }`}
              >
                Postular Trabajo
              </Link>
            </div>

            {/* Mobile: theme toggle + hamburger */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={toggle}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark
                    ? 'text-gray-400 hover:text-amber-400'
                    : 'text-gray-500 hover:text-primary-700'
                }`}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {isOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── LIGHT: Green navigation bar (UMAYOR style) ────────────────── */}
      {!isDark && (
        <nav className="bg-primary-700 hidden md:block shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-10 divide-x divide-white/20">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `px-6 h-full flex items-center text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-900 text-white'
                        : 'text-primary-100 hover:bg-primary-600 hover:text-white'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* ── DARK: Navigation links inline ─────────────────────────────── */}
      {isDark && (
        <nav className="bg-gray-950 border-b border-white/8 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-10 gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `px-4 h-full flex items-center text-xs font-medium uppercase tracking-wide transition-colors ${
                      isActive
                        ? 'text-primary-400 border-b-2 border-primary-500'
                        : 'text-gray-500 hover:text-gray-300'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* ── Mobile menu ────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className={`md:hidden border-t px-4 pb-4 pt-2 space-y-1 ${
            isDark ? 'bg-gray-950 border-white/10' : 'bg-white border-gray-100 shadow-lg'
          }`}
        >
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? isActive
                      ? 'bg-primary-500/15 text-primary-400'
                      : 'text-gray-400 hover:text-white hover:bg-white/8'
                    : isActive
                    ? 'bg-primary-50 text-primary-800'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <Link
            to="/postular"
            onClick={() => setIsOpen(false)}
            className="block text-center bg-primary-700 hover:bg-primary-600 text-white text-sm font-bold px-4 py-3 rounded-lg transition-all mt-2"
          >
            Postular Trabajo
          </Link>
        </div>
      )}
    </header>
  );
}
