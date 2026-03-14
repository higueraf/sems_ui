import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar, MapPin, Users, Award, BookOpen, Globe,
  ChevronRight, ChevronLeft, ArrowRight, FileText,
  Search, Layers, CheckCircle,
} from 'lucide-react';
import { eventsApi } from '../../api/events.api';
import { useTheme } from '../../hooks/useTheme';
import { useScrollToTop } from '../../hooks/useScrollToTop';

/* ─── Countdown hook ────────────────────────────────────────────────────── */
function calcTime(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function useCountdown(target: string) {
  const [t, setT] = useState(() => calcTime(target));
  useEffect(() => {
    setT(calcTime(target));
    const id = setInterval(() => setT(calcTime(target)), 1000);
    return () => clearInterval(id);
  }, [target]);
  return t;
}

/* ─── Hero background images — imágenes locales en public/images/ ────────── */
const HERO_IMAGES = [
  { url: '/images/hero-bg.jpg' },
  { url: '/images/banderas.png' },
  { url: '/images/sociales.png' },
];

/* ─── Carousel images — imágenes locales en public/images/ ────────────── */
const CAROUSEL_IMAGES = [
  { url: '/images/carousel-1.jpg', caption: 'Congreso Internacional de Investigación Científica', tag: 'Evento Académico' },
  { url: '/images/carousel-2.jpg', caption: 'Investigación Científica y Laboratorio', tag: 'Ciencia' },
  { url: '/images/carousel-3.jpg', caption: 'Colaboración Académica Internacional', tag: 'Investigación' },
  { url: '/images/carousel-4.jpg', caption: 'Publicaciones y Productos Científicos', tag: 'Publicaciones' },
  { url: '/images/carousel-5.jpg', caption: 'Red de Conocimiento y Ciencia Abierta', tag: 'Ciencia Abierta' },
  { url: '/images/carousel-6.jpg', caption: 'Producción Científica Latinoamericana', tag: 'Latinoamérica' },
];

/* ─── Quick links ──────────────────────────────────────────────────────── */
const QUICK_LINKS = [
  { to: '/postular', label: 'Postular Trabajo', sub: 'Envía tu investigación', icon: <FileText size={26} /> },
  { to: '/pautas', label: 'Pautas de Publicación', sub: 'Normas y formatos', icon: <BookOpen size={26} /> },
  { to: '/agenda', label: 'Agenda del Evento', sub: 'Programa oficial', icon: <Calendar size={26} /> },
  { to: '/verificar', label: 'Verificar Estado', sub: 'Consulta tu postulación', icon: <Search size={26} /> },
];

/* ══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const { isDark } = useTheme();
  useScrollToTop(); // Scroll automático al principio de la página
  const [slide, setSlide] = useState(0);
  const [heroSlide, setHeroSlide] = useState(() => Math.floor(Math.random() * HERO_IMAGES.length));
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const heroIntervalRef = useRef<ReturnType<typeof setInterval>>();

  const { data: event } = useQuery({ queryKey: ['event-active'], queryFn: eventsApi.getActive });

  const aboutSection = event?.pageSections?.find((s) => s.sectionKey === 'about');
  const datesSection = event?.pageSections?.find((s) => s.sectionKey === 'dates');
  const countdown = useCountdown(event?.startDate || '2026-05-18');

  /* Carousel helpers */
  const startTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setSlide((c) => (c + 1) % CAROUSEL_IMAGES.length), 5000);
  }, []);

  const startHeroTimer = useCallback(() => {
    clearInterval(heroIntervalRef.current);
    heroIntervalRef.current = setInterval(() => setHeroSlide((c) => (c + 1) % HERO_IMAGES.length), 4500);
  }, []);

  useEffect(() => {
    startTimer();
    startHeroTimer();
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(heroIntervalRef.current);
    };
  }, [startTimer, startHeroTimer]);

  const goTo = (i: number) => { setSlide(i); startTimer(); };
  const prev = () => goTo((slide - 1 + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length);
  const next = () => goTo((slide + 1) % CAROUSEL_IMAGES.length);

  /* ─── Theme class helpers ────────────────────────────────────────────── */
  const bg = isDark ? 'bg-gray-950' : 'bg-white';
  const bgAlt = isDark ? 'bg-gray-900' : 'bg-[#F5EDD8]';
  const text = isDark ? 'text-gray-100' : 'text-gray-900';
  const textMut = isDark ? 'text-gray-400' : 'text-gray-500';
  const green = isDark ? 'text-primary-400' : 'text-primary-700';
  const heading = isDark ? 'text-white' : 'text-primary-900';
  const divider = isDark ? 'bg-primary-500' : 'bg-primary-600';

  return (
    <div className={`font-body ${bg} ${text}`}>

      {/* ══ HERO — unified layout, only colors differ between themes ═══ */}
      <section className={`relative min-h-[92vh] flex flex-col justify-center overflow-hidden ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>

        {/* Background images for rotation with cross-fade */}
        <div className="absolute inset-0">
          {HERO_IMAGES.map((img, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out ${idx === heroSlide ? 'opacity-100' : 'opacity-0'
                }`}
              style={{
                backgroundImage: `url('${img.url}')`,
              }}
            />
          ))}
        </div>

        {/* Theme-dependent overlay */}
        <div className={`absolute inset-0 ${isDark
          ? 'bg-gradient-to-b from-gray-950/85 via-gray-950/70 to-gray-950'
          : 'bg-gradient-to-r from-white/95 via-white/88 to-white/55'
          }`} />
        <div className={`absolute inset-0 bg-gradient-to-tr ${isDark ? 'from-primary-950/50 via-transparent to-transparent'
          : 'from-primary-50/40 via-transparent to-transparent'
          }`} />

        {/* Orbital ring decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className={`absolute top-1/2 -right-20 -translate-y-1/2 w-[560px] h-[560px] rounded-full border ${isDark ? 'border-primary-500/10' : 'border-primary-200/40'}`} />
          <div className={`absolute top-1/2 -right-20 -translate-y-1/2 w-[420px] h-[420px] rounded-full border ${isDark ? 'border-primary-500/15' : 'border-primary-300/30'}`} />
          <div className={`absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full border ${isDark ? 'border-primary-700/10' : 'border-primary-200/20'}`} />
          <div className={`absolute top-1/3 right-1/4 w-72 h-72 rounded-full blur-3xl ${isDark ? 'bg-primary-600/5' : 'bg-primary-100/30'}`} />
        </div>

        {/* Hero content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-2xl">

            {/* Location badge */}
            <div className={`inline-flex items-center gap-2 border text-[11px] font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-widest ${isDark
              ? 'border-primary-500/35 bg-primary-800/25 text-primary-300'
              : 'border-primary-200 bg-primary-50 text-primary-700'
              }`}>
              <Globe size={11} /> Modalidad Híbrida · Cartagena de Indias, Colombia
            </div>

            {/* Title */}
            <h1 className="font-heading font-black leading-[1.05] mb-5">
              <span className={`block text-2xl md:text-3xl tracking-wider mb-1 uppercase ${isDark ? 'text-gray-400' : 'text-primary-500'}`}>
                II Simposio Internacional
              </span>
              <span className={`block text-5xl md:text-6xl lg:text-7xl ${isDark
                ? 'text-transparent bg-clip-text bg-gradient-to-br from-primary-300 via-primary-400 to-primary-600'
                : 'text-primary-900'
                }`}>
                DE CIENCIA<br />ABIERTA
              </span>
            </h1>

            {/* Date badge */}
            <div className="flex items-stretch w-fit mb-5">
              <div className={`border-2 px-6 py-2 font-bold tracking-[0.15em] text-lg ${isDark ? 'border-white/55 text-white' : 'border-primary-900 text-primary-900'
                }`}>
                18–22 DE MAYO
              </div>
              <div className={`px-5 py-2 font-black text-lg tracking-widest ${isDark ? 'bg-[#00ACC1] text-white' : 'bg-primary-700 text-white'
                }`}>
                2026
              </div>
            </div>

            {/* Tagline */}
            <p className={`text-lg italic mb-8 max-w-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              "Innovación para Transformar el Conocimiento en Sociedad"
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 mb-14">
              <Link
                to="/postular"
                className={`inline-flex items-center gap-2 font-bold px-8 py-3.5 rounded-xl transition-all text-base text-white ${isDark
                  ? 'bg-primary-600 hover:bg-primary-500 shadow-xl shadow-primary-950/60'
                  : 'bg-primary-700 hover:bg-primary-600 shadow-lg shadow-primary-900/25'
                  }`}
              >
                Postular Trabajo <ArrowRight size={18} />
              </Link>
              <Link
                to="/pautas"
                className={`inline-flex items-center gap-2 border-2 font-semibold px-8 py-3.5 rounded-xl transition-all text-base ${isDark
                  ? 'border-white/20 text-gray-300 hover:border-white/40 hover:text-white'
                  : 'border-primary-700 text-primary-700 hover:bg-primary-50'
                  }`}
              >
                Ver Pautas
              </Link>
            </div>

            {/* Countdown */}
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-3 ${isDark ? 'text-gray-500' : 'text-primary-500'}`}>
                Cuenta regresiva al evento
              </p>
              <div className="flex gap-3">
                {[
                  { v: countdown.days, l: 'Días' },
                  { v: countdown.hours, l: 'Horas' },
                  { v: countdown.minutes, l: 'Min' },
                  { v: countdown.seconds, l: 'Seg' },
                ].map(({ v, l }) => (
                  <div key={l} className="text-center">
                    <div className={`border rounded-xl w-16 h-16 md:w-[74px] md:h-[74px] flex items-center justify-center backdrop-blur-sm ${isDark
                      ? 'bg-white/5 border-white/10'
                      : 'bg-white/80 border-primary-200 shadow-sm'
                      }`}>
                      <span className={`font-heading font-black text-2xl md:text-3xl tabular-nums ${isDark ? 'text-white' : 'text-primary-900'}`}>
                        {String(v).padStart(2, '0')}
                      </span>
                    </div>
                    <span className={`text-[10px] mt-1.5 block uppercase tracking-wide ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats info bar */}
        <div className={`relative border-t ${isDark ? 'border-white/8 bg-black/25 backdrop-blur-sm' : 'border-primary-100 bg-primary-700'
          }`}>
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap justify-center gap-6 text-sm">
            {[
              { icon: <Award size={13} />, label: '80 Horas Certificadas' },
              { icon: <Users size={13} />, label: '+500 Participantes' },
              { icon: <BookOpen size={13} />, label: '274 Presentaciones' },
              { icon: <Layers size={13} />, label: '6 Ejes Temáticos' },
              { icon: <MapPin size={13} />, label: 'Cartagena de Indias' },
            ].map(({ icon, label }) => (
              <span key={label} className={`flex items-center gap-2 ${isDark ? 'text-gray-500' : 'text-primary-100'}`}>
                <span className={isDark ? 'text-primary-500' : 'text-primary-300'}>{icon}</span>
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ QUICK LINKS (UMAYOR style strip) ══════════════════════════════ */}
      <section className={`border-b ${isDark ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200'} shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100 dark:divide-white/10">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center justify-between gap-4 px-6 py-5 group transition-all ${isDark ? 'hover:bg-primary-900/30' : 'hover:bg-[#F5EDD8]'
                  }`}
              >
                <div className="min-w-0">
                  <div className={`font-heading font-bold text-sm truncate group-hover:text-primary-600 transition-colors ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {link.label}
                  </div>
                  <div className={`text-xs mt-0.5 ${textMut}`}>{link.sub}</div>
                </div>
                <div className={`flex-shrink-0 p-2.5 rounded-xl transition-colors ${isDark
                  ? 'bg-primary-700/25 text-primary-400 group-hover:bg-primary-700/40'
                  : 'bg-[#F5EDD8] text-primary-700 group-hover:bg-primary-100'
                  }`}>
                  {link.icon}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ IMAGE CAROUSEL ════════════════════════════════════════════════ */}
      <section className={`py-14 ${bgAlt}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className={`text-[11px] font-bold uppercase tracking-[0.2em] ${green}`}>Simposio en Imágenes</span>
            <h2 className={`font-heading font-black text-2xl md:text-3xl mt-1 ${heading}`}>
              Ciencia, Investigación y Conocimiento
            </h2>
            <div className={`w-14 h-1 rounded-full mx-auto mt-3 ${divider}`} />
          </div>

          <div className="relative overflow-hidden rounded-2xl shadow-2xl">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${slide * 100}%)` }}
            >
              {CAROUSEL_IMAGES.map((img, i) => (
                <div key={i} className="relative flex-shrink-0 w-full h-[340px] md:h-[480px]">
                  <img src={img.url} alt={img.caption} className="w-full h-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                  <div className="absolute bottom-6 left-6 text-white">
                    <span className="bg-primary-600 text-[11px] font-black px-3 py-1.5 rounded-full mb-2 inline-block uppercase tracking-widest">
                      {img.tag}
                    </span>
                    <p className="font-heading font-bold text-lg md:text-xl drop-shadow-lg">{img.caption}</p>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-primary-700 text-white flex items-center justify-center transition-all backdrop-blur-sm z-10">
              <ChevronLeft size={20} />
            </button>
            <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-primary-700 text-white flex items-center justify-center transition-all backdrop-blur-sm z-10">
              <ChevronRight size={20} />
            </button>

            <div className="absolute bottom-5 right-6 flex gap-1.5 z-10">
              {CAROUSEL_IMAGES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`rounded-full transition-all duration-300 ${i === slide ? 'bg-primary-400 w-6 h-2.5' : 'bg-white/40 w-2.5 h-2.5 hover:bg-white/70'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ ABOUT (two-column) ════════════════════════════════════════════ */}
      {aboutSection && (
        <section className={`py-20 ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className={`text-[11px] font-bold uppercase tracking-[0.2em] block mb-2 ${green}`}>Sobre el Simposio</span>
                <h2 className={`font-heading font-black text-3xl md:text-4xl mb-1 ${heading}`}>
                  {aboutSection.title || 'II Simposio Internacional de Ciencia Abierta'}
                </h2>
                <div className={`w-14 h-1.5 rounded-full mb-6 ${divider}`} />

                <div className="flex gap-2 mb-6 flex-wrap">
                  {['El Evento', 'Objetivos', 'Contacto'].map((tab, i) => (
                    <button key={tab} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${i === 0
                      ? isDark ? 'bg-primary-600 text-white shadow-md' : 'bg-amber-500 text-white shadow-md'
                      : isDark
                        ? 'bg-gray-800 text-gray-400 border border-white/10 hover:bg-gray-700'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-700'
                      }`}>{tab}</button>
                  ))}
                </div>

                <div className={`space-y-4 text-[15px] leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {aboutSection.content?.split('\n\n').slice(0, 3).map((p, i) => (
                    <p key={i} className={i === 0 ? 'font-semibold' : ''}>{p}</p>
                  ))}
                </div>

                {(aboutSection.metadata?.slogans?.length ?? 0) > 0 && (
                  <div className="mt-6 space-y-2">
                    {aboutSection.metadata?.slogans?.map((s: string, i: number) => (
                      <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-lg border-l-4 ${isDark ? 'bg-primary-900/25 border-primary-500 text-primary-300' : 'bg-primary-50 border-primary-600 text-primary-800'
                        }`}>
                        <CheckCircle size={15} className="mt-0.5 flex-shrink-0" />
                        <span className="text-sm font-semibold italic">"{s}"</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-5">
                {[
                  { icon: <Award size={38} />, value: `${event?.certifiedHours || 80}h`, label: 'Horas Certificadas', alt: false },
                  { icon: <Users size={38} />, value: '+500', label: 'Participantes Esperados', alt: true },
                  { icon: <BookOpen size={38} />, value: '~274', label: 'Presentaciones', alt: false },
                  { icon: <Globe size={38} />, value: `${event?.thematicAxes?.length || 6}`, label: 'Ejes Temáticos', alt: true },
                ].map((stat) => (
                  <div key={stat.label} className={`rounded-2xl p-6 text-center shadow-sm transition-transform hover:-translate-y-1 ${isDark
                    ? stat.alt ? 'bg-primary-800/30 border border-primary-600/20' : 'bg-gray-800'
                    : stat.alt ? 'bg-primary-700 text-white' : 'bg-white border border-gray-100'
                    }`}>
                    <div className={`flex justify-center mb-3 ${isDark ? 'text-primary-400' : stat.alt ? 'text-primary-200' : 'text-primary-600'}`}>{stat.icon}</div>
                    <div className={`font-heading font-black text-3xl mb-1 ${isDark ? 'text-white' : stat.alt ? 'text-white' : 'text-primary-800'}`}>{stat.value}</div>
                    <div className={`text-xs leading-tight ${isDark ? 'text-gray-400' : stat.alt ? 'text-primary-200' : 'text-gray-500'}`}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══ THEMATIC AXES ════════════════════════════════════════════════ */}
      {event?.thematicAxes && event.thematicAxes.length > 0 && (
        <section className={`py-20 ${bgAlt}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className={`text-[11px] font-bold uppercase tracking-[0.2em] block mb-2 ${green}`}>Áreas de conocimiento</span>
              <h2 className={`font-heading font-black text-3xl md:text-4xl ${heading}`}>Ejes Temáticos</h2>
              <div className={`w-14 h-1.5 rounded-full mx-auto mt-3 ${divider}`} />
              <p className={`mt-4 max-w-xl mx-auto text-sm ${textMut}`}>El simposio aborda seis grandes áreas del conocimiento científico contemporáneo</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {event.thematicAxes.map((axis, i) => (
                <div key={axis.id} className={`group rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg animate-fade-in-up ${isDark ? 'bg-gray-900 border-white/8 hover:border-primary-500/35' : 'bg-white border-gray-100 hover:border-primary-200'
                  }`} style={{ animationDelay: `${i * 65}ms` }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-white font-black text-base shadow-lg" style={{ backgroundColor: axis.color || '#007F3A' }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className={`font-heading font-bold mb-2 group-hover:text-primary-600 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{axis.name}</h3>
                  {axis.description && <p className={`text-sm leading-relaxed line-clamp-3 ${textMut}`}>{axis.description}</p>}
                  <div className="mt-5 h-0.5 w-0 group-hover:w-full rounded-full transition-all duration-500" style={{ backgroundColor: axis.color || '#007F3A' }} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ IMPORTANT DATES ══════════════════════════════════════════════ */}
      {datesSection?.metadata?.dates && (
        <section className={`py-20 ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className={`text-[11px] font-bold uppercase tracking-[0.2em] block mb-2 ${green}`}>Calendario</span>
              <h2 className={`font-heading font-black text-3xl md:text-4xl ${heading}`}>{datesSection.title}</h2>
              <div className={`w-14 h-1.5 rounded-full mx-auto mt-3 ${divider}`} />
            </div>
            <div className="space-y-3">
              {datesSection.metadata.dates.map((item: any, i: number) => (
                <div key={i} className={`flex items-center gap-5 p-5 rounded-2xl border-l-4 transition-all hover:translate-x-1.5 ${item.highlight
                  ? isDark ? 'bg-accent-950/30 border-accent-500' : 'bg-red-50 border-accent-500 shadow-sm'
                  : isDark ? 'bg-gray-900 border-primary-600' : 'bg-gray-50 border-primary-500 shadow-sm'
                  }`}>
                  <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${item.highlight
                    ? isDark ? 'bg-accent-900/40 text-accent-400' : 'bg-red-100 text-accent-600'
                    : isDark ? 'bg-primary-800/40 text-primary-400' : 'bg-primary-50 text-primary-700'
                    }`}>
                    <Calendar size={18} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{item.label}</p>
                  </div>
                  <div className={`flex-shrink-0 text-sm font-black px-4 py-1.5 rounded-lg ${item.highlight
                    ? isDark ? 'bg-accent-800/30 text-accent-300' : 'bg-red-100 text-accent-700'
                    : isDark ? 'bg-primary-800/30 text-primary-300' : 'bg-primary-50 text-primary-700'
                    }`}>
                    {item.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ CTA ══════════════════════════════════════════════════════════ */}
      <section className={`relative py-24 overflow-hidden ${isDark ? 'bg-primary-900' : 'bg-primary-700'}`}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border-2 border-white/10" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full border-2 border-white/10" />
          <div className="absolute top-0 bottom-0 right-0 w-1/3 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 40px)' }} />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center text-white">
          <span className="text-primary-300 text-[11px] font-bold uppercase tracking-[0.2em] mb-4 block">
            Convocatoria Abierta · Participación Gratuita
          </span>
          <h2 className="font-heading font-black text-4xl md:text-5xl mb-4 leading-tight">
            ¿Listo para compartir<br />tu investigación?
          </h2>
          <p className="text-primary-200 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Únete a cientos de investigadores latinoamericanos. Postula tu trabajo y forma parte de este evento académico internacional.{' '}
            <strong className="text-white">¡Sin costo de inscripción!</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/postular" className="inline-flex items-center justify-center gap-2 bg-white text-primary-800 hover:bg-gray-50 font-black px-10 py-4 rounded-xl transition-all shadow-2xl text-lg">
              Postular Ahora <ArrowRight size={20} />
            </Link>
            <Link to="/verificar" className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white hover:bg-white/10 font-semibold px-10 py-4 rounded-xl transition-all text-lg">
              Verificar Estado
            </Link>
          </div>
        </div>
      </section>

      {/* Los logos de organizadores se muestran en el Footer */}

    </div>
  );
}
