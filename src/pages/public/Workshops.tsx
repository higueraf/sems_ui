import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Clock, Youtube, Play } from 'lucide-react';
import { eventsApi } from '../../api/events.api';
import { ScientificEvent, EventVideo } from '../../types';
import { formatDate } from '../../utils';
import { useTheme } from '../../hooks/useTheme';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0];
    const v = u.searchParams.get('v');
    if (v) return v;
    const m = u.pathname.match(/\/(live|shorts|embed|v)\/([^/?&]+)/);
    if (m) return m[2];
    return null;
  } catch {
    return null;
  }
}

function getYouTubeThumbnail(url: string): string {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
}

function getYouTubeEmbed(url: string): string {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : '';
}

// ── Subcomponentes ────────────────────────────────────────────────────────────

function VideoModal({ video, onClose }: { video: EventVideo; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl aspect-video rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <iframe
          src={getYouTubeEmbed(video.youtubeUrl)}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold transition-colors"
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function VideoCard({ video }: { video: EventVideo }) {
  const [open, setOpen] = useState(false);
  const thumb = getYouTubeThumbnail(video.youtubeUrl);

  return (
    <>
      <div
        className="group relative rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-shadow bg-gray-900"
        onClick={() => setOpen(true)}
      >
        {thumb ? (
          <img
            src={thumb}
            alt={video.title}
            className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
          />
        ) : (
          <div className="w-full aspect-video bg-gray-800 flex items-center justify-center">
            <Youtube size={40} className="text-red-500" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play size={22} className="text-white ml-1" fill="white" />
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-6">
          <p className="text-white text-sm font-semibold line-clamp-2">{video.title}</p>
          {video.description && (
            <p className="text-gray-300 text-xs mt-0.5 line-clamp-1">{video.description}</p>
          )}
        </div>
      </div>
      {open && <VideoModal video={video} onClose={() => setOpen(false)} />}
    </>
  );
}

function WorkshopPanel({ event }: { event: ScientificEvent }) {
  const FORMAT_LABELS: Record<string, string> = {
    in_person: 'Presencial',
    online: 'En línea',
    hybrid: 'Híbrido',
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {event.logoUrl && (
          <img
            src={event.logoUrl}
            alt={event.name}
            className="w-24 h-24 object-contain rounded-xl border border-gray-200 bg-white p-2 flex-shrink-0"
          />
        )}
        <div className="flex-1">
          <div className="flex flex-wrap gap-2 mb-2">
            {event.edition && (
              <span className="badge bg-amber-100 text-amber-700 text-xs font-bold">{event.edition}</span>
            )}
            <span className="badge bg-gray-100 text-gray-600 text-xs">
              {FORMAT_LABELS[event.format] ?? event.format}
            </span>
          </div>
          <h2 className="font-heading font-black text-2xl md:text-3xl text-gray-900 leading-tight">
            {event.name}
          </h2>
          {event.tagline && (
            <p className="text-amber-600 text-base mt-1 italic">{event.tagline}</p>
          )}
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
            {event.startDate && (
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                {formatDate(event.startDate)}
                {event.endDate && event.endDate !== event.startDate &&
                  ` – ${formatDate(event.endDate)}`}
              </span>
            )}
            {(event.city || event.country) && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} />
                {[event.city, event.country].filter(Boolean).join(', ')}
              </span>
            )}
            {event.certifiedHours && (
              <span className="flex items-center gap-1.5">
                <Clock size={14} />
                {event.certifiedHours}h certificadas
              </span>
            )}
          </div>
          {event.description && (
            <p className="text-gray-600 text-sm mt-3 leading-relaxed line-clamp-3">
              {event.description}
            </p>
          )}
        </div>
      </div>

      {event.videos && event.videos.length > 0 ? (
        <div>
          <h3 className="font-heading font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <Youtube size={20} className="text-red-500" />
            Videos del Taller
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {event.videos.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-gray-400">
          <Youtube size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Próximamente se agregarán los videos de este taller.</p>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function Workshops() {
  const { isDark } = useTheme();
  const bg   = isDark ? 'bg-gray-950' : 'bg-white';
  const card = isDark ? 'bg-gray-800 border-white/10' : 'bg-white border-gray-100';

  const { data: events, isLoading } = useQuery({
    queryKey: ['events-workshops'],
    queryFn: eventsApi.getWorkshops,
  });

  const [selected, setSelected] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const canPrev = selected > 0;
  const canNext = events ? selected < events.length - 1 : false;

  const scrollTo = (index: number) => {
    setSelected(index);
    const container = sliderRef.current;
    if (!container) return;
    const tab = container.children[index] as HTMLElement;
    if (tab) tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  return (
    <div className={`min-h-screen ${bg}`}>
      {/* Hero */}
      <div className={`py-16 relative overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-primary-700'}`}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full border border-white/10" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full border border-white/5" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <span className={`text-[11px] font-bold uppercase tracking-[0.2em] block mb-3 ${isDark ? 'text-primary-400' : 'text-primary-200'}`}>
            II Simposio Internacional de Ciencia Abierta
          </span>
          <h1 className="font-heading font-black text-4xl md:text-5xl text-white mb-3">
            Talleres de Capacitación
          </h1>
          <div className="w-16 h-1 bg-amber-500 rounded-full mx-auto mb-4" />
          <p className={`max-w-2xl mx-auto text-base ${isDark ? 'text-gray-400' : 'text-primary-100'}`}>
            Explora los talleres de formación y capacitación asociados a nuestros simposios.
            Accede a los materiales, grabaciones y recursos de cada edición.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && (!events || events.length === 0) && (
          <div className="text-center py-20">
            <Youtube size={48} className="mx-auto mb-4 text-gray-300" />
            <h2 className="font-heading font-bold text-xl text-gray-500 mb-2">
              Aún no hay talleres anteriores
            </h2>
            <p className="text-gray-400 text-sm">
              Los talleres pasados aparecerán aquí una vez finalicen.
            </p>
          </div>
        )}

        {!isLoading && events && events.length > 0 && (
          <div className="space-y-8">
            {/* Slider / Tabs */}
            {events.length > 1 && (
              <div className="relative">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scrollTo(selected - 1)}
                    disabled={!canPrev}
                    className="flex-shrink-0 w-9 h-9 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-primary-600 hover:border-primary-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    aria-label="Anterior"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div
                    ref={sliderRef}
                    className="flex gap-2 overflow-x-auto flex-1 scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {events.map((ev, i) => (
                      <button
                        key={ev.id}
                        onClick={() => scrollTo(i)}
                        className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border ${
                          i === selected
                            ? 'bg-primary-700 text-white border-primary-700 shadow-md'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
                        }`}
                      >
                        {ev.edition ? `${ev.edition} · ${ev.name}` : ev.name}
                        {ev.startDate && (
                          <span className={`ml-2 text-xs font-normal ${i === selected ? 'text-primary-200' : 'text-gray-400'}`}>
                            {new Date(ev.startDate).getFullYear()}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => scrollTo(selected + 1)}
                    disabled={!canNext}
                    className="flex-shrink-0 w-9 h-9 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-primary-600 hover:border-primary-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    aria-label="Siguiente"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                {events.length > 3 && (
                  <div className="flex justify-center gap-1.5 mt-3">
                    {events.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => scrollTo(i)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === selected ? 'bg-primary-600 w-5' : 'bg-gray-300'
                        }`}
                        aria-label={`Ir al taller ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Panel del taller seleccionado */}
            <div className={`${card} rounded-2xl shadow-sm border p-6 md:p-8`}>
              <WorkshopPanel event={events[selected]} />
            </div>

            {events.length > 1 && (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => scrollTo(selected - 1)}
                  disabled={!canPrev}
                  className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                  {canPrev && events[selected - 1].name}
                </button>
                <span className="text-xs text-gray-400">
                  {selected + 1} / {events.length}
                </span>
                <button
                  onClick={() => scrollTo(selected + 1)}
                  disabled={!canNext}
                  className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  {canNext && events[selected + 1].name}
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
