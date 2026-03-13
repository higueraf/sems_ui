import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, MapPin, User, Calendar } from 'lucide-react';
import { eventsApi } from '../../api/events.api';
import { agendaApi } from '../../api/agenda.api';
import { AgendaSlot } from '../../types';
import { formatTime, SLOT_TYPE_LABELS } from '../../utils';
import { useTheme } from '../../hooks/useTheme';
import { useScrollToTop } from '../../hooks/useScrollToTop';

const SLOT_COLORS: Record<string, string> = {
  keynote: 'border-l-accent-500 bg-accent-50',
  presentation: 'border-l-primary-500 bg-white',
  break: 'border-l-gray-400 bg-gray-50',
  ceremony: 'border-l-yellow-500 bg-yellow-50',
  workshop: 'border-l-blue-500 bg-blue-50',
  panel: 'border-l-purple-500 bg-purple-50',
};

const SLOT_BORDER_DARK: Record<string, string> = {
  keynote: 'border-l-accent-500',
  presentation: 'border-l-primary-500',
  break: 'border-l-gray-400',
  ceremony: 'border-l-yellow-500',
  workshop: 'border-l-blue-500',
  panel: 'border-l-purple-500',
};

function SlotCard({ slot, isDark }: { slot: AgendaSlot; isDark: boolean }) {
  const lightColor = SLOT_COLORS[slot.type] || 'border-l-gray-300 bg-white';
  const darkBorder = SLOT_BORDER_DARK[slot.type] || 'border-l-gray-300';
  const colorClass = isDark ? `${darkBorder} bg-gray-800` : lightColor;

  const textMut  = isDark ? 'text-gray-400' : 'text-gray-500';
  const textFade = isDark ? 'text-gray-500' : 'text-gray-400';
  const titleClr = isDark ? 'text-gray-100' : 'text-gray-900';
  const divLine  = isDark ? 'bg-gray-600' : 'bg-gray-200';
  const typeBadge = isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600';

  const titleText = slot.submission?.titleEs || slot.title || '';
  const speakerText = slot.speakerName || slot.submission?.authors?.find((a) => a.isCorresponding)?.fullName;
  const affiliation = slot.speakerAffiliation || slot.submission?.authors?.[0]?.affiliation;

  return (
    <div className={`border-l-4 ${colorClass} rounded-r-xl shadow-sm p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-start gap-3">
        <div className="text-center min-w-[60px]">
          <p className={`text-xs font-medium ${textFade}`}>{formatTime(slot.startTime)}</p>
          <div className={`w-px h-4 ${divLine} mx-auto my-1`} />
          <p className={`text-xs font-medium ${textFade}`}>{formatTime(slot.endTime)}</p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`badge text-xs ${typeBadge}`}>
              {SLOT_TYPE_LABELS[slot.type] || slot.type}
            </span>
            {slot.thematicAxis && (
              <span
                className="badge text-xs text-white"
                style={{ backgroundColor: slot.thematicAxis.color || '#007F3A' }}
              >
                {slot.thematicAxis.name}
              </span>
            )}
          </div>
          {titleText && (
            <h4 className={`font-semibold text-sm leading-tight mb-1 ${titleClr}`}>{titleText}</h4>
          )}
          <div className="flex flex-wrap gap-3 mt-2">
            {speakerText && (
              <div className={`flex items-center gap-1 text-xs ${textMut}`}>
                <User size={12} />
                <span>
                  {speakerText}
                  {slot.submission?.authors?.find((a) => a.isCorresponding)?.country?.flagEmoji && (
                    <span className="ml-1">
                      {slot.submission?.authors?.find((a) => a.isCorresponding)?.country?.flagEmoji}
                    </span>
                  )}
                </span>
              </div>
            )}
            {affiliation && (
              <div className={`text-xs ${textFade}`}>{affiliation}</div>
            )}
            {slot.room && (
              <div className={`flex items-center gap-1 text-xs ${textMut}`}>
                <MapPin size={12} /> {slot.room}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgendaPublic() {
  const { isDark } = useTheme();
  useScrollToTop(); // Scroll automático al principio de la página
  const bg      = isDark ? 'bg-gray-950' : 'bg-white';
  const bgAlt   = isDark ? 'bg-gray-900' : 'bg-[#F5EDD8]';
  const text    = isDark ? 'text-gray-100' : 'text-gray-900';
  const textMut = isDark ? 'text-gray-400' : 'text-gray-500';
  const green   = isDark ? 'text-primary-400' : 'text-primary-700';
  const heading = isDark ? 'text-white' : 'text-primary-900';
  const divider = isDark ? 'bg-primary-500' : 'bg-primary-600';
  const card    = isDark ? 'bg-gray-800 border-white/10' : 'bg-white border-gray-100';

  const { data: event } = useQuery({ queryKey: ['event-active'], queryFn: eventsApi.getActive });
  const { data: slots, isLoading } = useQuery({
    queryKey: ['agenda-public', event?.id],
    queryFn: () => agendaApi.getPublic(event!.id),
    enabled: !!event?.id && event?.isAgendaPublished,
  });

  const slotsByDay = (slots || []).reduce<Record<string, AgendaSlot[]>>((acc, slot) => {
    const day = slot.day.split('T')[0];
    if (!acc[day]) acc[day] = [];
    acc[day].push(slot);
    return acc;
  }, {});

  const days = Object.keys(slotsByDay).sort();

  const [selectedDay, setSelectedDay] = useState<string | null>(days[0] || null);

  const hero = (
    <div className={`py-16 relative overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-primary-700'}`}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full border border-white/10" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full border border-white/5" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 text-center">
        <span className={`text-[11px] font-bold uppercase tracking-[0.2em] block mb-3 ${isDark ? 'text-primary-400' : 'text-primary-200'}`}>
          II Simposio Internacional de Ciencia Abierta
        </span>
        <h1 className="font-heading font-black text-4xl md:text-5xl text-white mb-3">Agenda del Evento</h1>
        <div className="w-16 h-1 bg-amber-500 rounded-full mx-auto mb-4" />
        <p className={`max-w-2xl mx-auto text-base ${isDark ? 'text-gray-400' : 'text-primary-100'}`}>
          {event?.name}
        </p>
      </div>
    </div>
  );

  if (!event?.isAgendaPublished) {
    return (
      <div className={`min-h-screen ${bg}`}>
        {hero}
        <div className={`max-w-4xl mx-auto px-4 py-20 text-center`}>
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Calendar size={48} className={isDark ? 'text-gray-500' : 'text-gray-300'} />
          </div>
          <h2 className={`font-heading font-bold text-2xl mb-3 ${heading}`}>Agenda en Construcción</h2>
          <p className={`max-w-md mx-auto ${textMut}`}>
            La agenda del evento estará disponible próximamente. Siga revisando esta sección para más información.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bg}`}>
      {hero}

      <div className="max-w-5xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`${card} rounded-xl border p-5 animate-pulse`}>
                <div className={`h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/4 mb-3`} />
                <div className={`h-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded w-full mb-2`} />
                <div className={`h-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded w-3/4`} />
              </div>
            ))}
          </div>
        ) : days.length === 0 ? (
          <div className={`text-center py-12 ${textMut}`}>
            No hay actividades programadas aún.
          </div>
        ) : (
          <>
            {/* Day Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
              {days.map((day) => {
                const date = parseISO(day);
                const isSelected = selectedDay === day || (!selectedDay && days[0] === day);
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`flex-shrink-0 px-5 py-3 rounded-xl font-medium text-sm transition-all ${
                      isSelected
                        ? isDark
                          ? 'bg-primary-600 text-white shadow-md'
                          : 'bg-primary-500 text-white shadow-md'
                        : isDark
                          ? 'bg-gray-800 text-gray-300 border border-white/10 hover:bg-gray-700'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <div className="font-heading font-bold">
                      {format(date, 'EEE', { locale: es }).toUpperCase()}
                    </div>
                    <div className="text-xs opacity-80">
                      {format(date, 'dd MMM', { locale: es })}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Slots */}
            {(selectedDay || days[0]) && (
              <div>
                <h2 className={`font-heading font-bold text-xl mb-6 flex items-center gap-2 ${heading}`}>
                  <Calendar size={20} className={green} />
                  {format(parseISO(selectedDay || days[0]), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
                </h2>
                <div className="space-y-3">
                  {slotsByDay[selectedDay || days[0]]?.map((slot) => (
                    <SlotCard key={slot.id} slot={slot} isDark={isDark} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
