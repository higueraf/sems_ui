import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube, Linkedin, Twitter, Building2 } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { organizersApi } from '../../api/index';
import { eventsApi } from '../../api/events.api';
import { getFileUrl } from '../../utils';

const navLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/pautas', label: 'Pautas de Publicación' },
  { to: '/organizadores', label: 'Organizadores' },
  { to: '/agenda', label: 'Agenda del Evento' },
  { to: '/postular', label: 'Postular Trabajo' },
  { to: '/verificar', label: 'Verificar Estado' },
];

const socials = [
  { icon: <Facebook size={20} />, href: '#', label: 'Facebook' },
  { icon: <Twitter size={20} />, href: '#', label: 'Twitter/X' },
  { icon: <Youtube size={20} />, href: '#', label: 'YouTube' },
  { icon: <Instagram size={20} />, href: '#', label: 'Instagram' },
  { icon: <Linkedin size={20} />, href: '#', label: 'LinkedIn' },
];

// Colores de fallback por siglas cuando no hay logo subido
const FALLBACK_COLORS: Record<string, string> = {
  UMAYOR: '#007F3A', UTE: '#006666', UEB: '#C41230', UTA: '#003087',
  UPSE: '#1A4B8C', UINL: '#1A2E5A', FENAPE: '#8B1A1A', RRUE: '#4B0082', COLPB: '#8B4513',
};
const getFallbackColor = (abbr?: string | null) =>
  (abbr && FALLBACK_COLORS[abbr]) || '#4B5563';

export default function Footer() {
  const { isDark } = useTheme();
  const year = new Date().getFullYear();

  const { data: event } = useQuery({ queryKey: ['event-active'], queryFn: eventsApi.getActive });
  const { data: organizers } = useQuery({
    queryKey: ['organizers-public', event?.id],
    queryFn: () => organizersApi.getPublic(event!.id),
    enabled: !!event?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Solo instituciones visibles (personas quedan fuera del strip de logos)
  const institutions = organizers?.filter((o) => o.type === 'institution') ?? [];

  return (
    <footer>
      {/* ── Logo marquee — carrusel infinito de una sola línea ─────────── */}
      <div className={`border-t-4 border-amber-500 py-6 ${
        isDark ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className={`text-center text-[10px] font-bold uppercase tracking-[0.2em] mb-5 ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Universidades e instituciones organizadoras
          </p>
        </div>

        {/* Pista con overflow hidden para cortar el carrusel */}
        <div className="overflow-hidden w-full">
          {institutions.length === 0 ? (
            /* Skeleton mientras carga */
            <div className="flex items-center gap-6 px-6">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className={`flex-shrink-0 w-28 h-16 rounded-lg animate-pulse ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`} />
              ))}
            </div>
          ) : (
            /* Dos copias para el loop perfecto */
            <div className="logos-marquee">
              {[0, 1].map((pass) => (
                <div key={pass} className="logos-marquee-inner">
                  {institutions.map((org) => (
                    <div
                      key={org.id + '-' + pass}
                      title={`Visitar sitio web de ${org.name}`}
                      className={`inline-flex flex-col items-center gap-1.5 mx-5 select-none
                        transition-all duration-300 group flex-shrink-0 ${
                        isDark ? 'opacity-40 hover:opacity-90' : 'opacity-65 hover:opacity-100'
                      }`}
                    >
                      {/* Link wrapper */}
                      {org.website ? (
                        <a
                          href={org.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex flex-col items-center gap-1.5 w-full"
                          title={`Visitar sitio web de ${org.name}`}
                        >
                          {/* Caja del logo — 128×68 px fija */}
                          <div className="w-32 h-[68px] flex items-center justify-center
                            group-hover:scale-110 transition-transform duration-300">
                            {org.logoUrl ? (
                              <img
                                src={getFileUrl(org.logoUrl)}
                                alt={org.shortName || org.name}
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                  const ph = target.nextElementSibling as HTMLElement;
                                  if (ph) ph.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            {/* Placeholder sin logo */}
                            <div
                              className={`w-14 h-14 rounded-2xl items-center justify-center
                                text-white shadow-md ${
                                org.logoUrl ? 'hidden' : 'flex'
                              }`}
                              style={{ backgroundColor: getFallbackColor(org.shortName) }}
                            >
                              <Building2 size={22} className="opacity-80" />
                            </div>
                          </div>

                          {/* Sigla */}
                          <span className={`text-[9px] font-bold leading-tight text-center ${
                            isDark ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            {org.shortName
                              || org.name.split(' ').filter((w: string) => w.length > 2).map((w: string) => w[0]).join('').slice(0, 6)}
                          </span>
                        </a>
                      ) : (
                        /* Sin website - mostrar sin link */
                        <>
                          {/* Caja del logo — 128×68 px fija */}
                          <div className="w-32 h-[68px] flex items-center justify-center
                            group-hover:scale-110 transition-transform duration-300 cursor-default">
                            {org.logoUrl ? (
                              <img
                                src={getFileUrl(org.logoUrl)}
                                alt={org.shortName || org.name}
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                  const ph = target.nextElementSibling as HTMLElement;
                                  if (ph) ph.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            {/* Placeholder sin logo */}
                            <div
                              className={`w-14 h-14 rounded-2xl items-center justify-center
                                text-white shadow-md ${
                                org.logoUrl ? 'hidden' : 'flex'
                              }`}
                              style={{ backgroundColor: getFallbackColor(org.shortName) }}
                            >
                              <Building2 size={22} className="opacity-80" />
                            </div>
                          </div>

                          {/* Sigla */}
                          <span className={`text-[9px] font-bold leading-tight text-center ${
                            isDark ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            {org.shortName
                              || org.name.split(' ').filter((w: string) => w.length > 2).map((w: string) => w[0]).join('').slice(0, 6)}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Main footer body — deep green (UMAYOR style) ─────────────── */}
      <div
        className="relative"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #052e16 0%, #064e3b 50%, #052e16 100%)'
            : 'linear-gradient(135deg, #052e16 0%, #065f46 50%, #052e16 100%)',
        }}
      >
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid md:grid-cols-3 gap-12">

            {/* Col 1: Event identity */}
            <div>
              {/* Logo mark */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <span className="font-heading font-black text-xl text-white">CA</span>
                </div>
                <div>
                  <div className="font-heading font-black text-white text-sm leading-tight">
                    SIMPOSIO INTERNACIONAL
                  </div>
                  <div className="text-primary-300 text-[11px] font-semibold">
                    DE CIENCIA ABIERTA 2026
                  </div>
                </div>
              </div>

              {/* AVANZA badge */}
              <div className="inline-flex items-center gap-2 bg-amber-500 px-3 py-1.5 rounded mb-5">
                <span className="font-black text-white text-xs tracking-wide">AVANZA</span>
                <span className="text-amber-100 text-[10px]">Hacia la Excelencia</span>
              </div>

              <div className="space-y-3 text-sm text-primary-200">
                <div className="flex items-start gap-2.5">
                  <MapPin size={15} className="mt-0.5 text-primary-400 flex-shrink-0" />
                  <span>
                    <strong className="text-white">Sede Principal:</strong> Cartagena de Indias — Centro Histórico<br />
                    Institución Universitaria Mayor de Cartagena
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Mail size={15} className="mt-0.5 text-primary-400 flex-shrink-0" />
                  <a href="mailto:david.moralesl@ute.edu.ec" className="hover:text-white transition-colors">
                    david.moralesl@ute.edu.ec
                  </a>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone size={15} className="mt-0.5 text-primary-400 flex-shrink-0" />
                  <span>+593 989 221 612</span>
                </div>
              </div>
            </div>

            {/* Col 2: Navigation links */}
            <div>
              <h4 className="text-amber-400 font-black text-[11px] uppercase tracking-[0.2em] mb-5">
                ENLACES DE INTERÉS
              </h4>
              <ul className="space-y-2.5">
                {navLinks.map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="flex items-center gap-2 text-sm text-primary-300 hover:text-white transition-colors group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 group-hover:bg-white transition-colors" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-6 border-t border-white/10">
                <h4 className="text-amber-400 font-black text-[11px] uppercase tracking-[0.2em] mb-4">
                  INFORMACIÓN
                </h4>
                <ul className="space-y-2">
                  {['Política de Privacidad', 'Términos y Condiciones', 'Accesibilidad'].map((item) => (
                    <li key={item}>
                      <a href="#" className="flex items-center gap-2 text-sm text-primary-300 hover:text-white transition-colors group">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0 group-hover:bg-white transition-colors" />
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Col 3: Social + date */}
            <div>
              <h4 className="text-amber-400 font-black text-[11px] uppercase tracking-[0.2em] mb-5">
                SÍGUENOS EN REDES SOCIALES
              </h4>
              <div className="flex gap-3 mb-6">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    title={s.label}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-primary-600 border border-white/15 flex items-center justify-center text-primary-300 hover:text-white transition-all"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>

              <div className="text-xs text-primary-400 mb-6">
                Fecha de actualización: {new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>

              {/* Quality seal (like UMAYOR) */}
              <div className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-2xl p-4">
                <div className="w-14 h-14 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-black text-[10px] text-center leading-tight">LA CALIDAD,<br />UN COMPROMISO</span>
                </div>
                <div className="text-xs text-primary-200 leading-relaxed">
                  <strong className="text-white block">Ciencia de Calidad</strong>
                  Evento avalado por instituciones académicas de Latinoamérica y España
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Copyright bar ─────────────────────────────────────────────── */}
      <div
        style={{ background: '#021a0e' }}
        className="py-3 border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-primary-600">
            © {year} — II Simposio Internacional de Ciencia Abierta. Todos los derechos reservados.
          </p>
          <Link
            to="/dashboard/login"
            className="text-xs text-primary-700 hover:text-primary-400 transition-colors"
          >
            Acceso Administrativo
          </Link>
        </div>
      </div>
    </footer>
  );
}
