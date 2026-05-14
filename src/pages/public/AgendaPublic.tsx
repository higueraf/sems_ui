import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, MapPin, User, Printer, Clock } from 'lucide-react';
import { eventsApi } from '../../api/events.api';
import { agendaApi } from '../../api/agenda.api';
import { AgendaSlot } from '../../types';
import { formatTime, SLOT_TYPE_LABELS } from '../../utils';
import { useTheme } from '../../hooks/useTheme';
import { useScrollToTop } from '../../hooks/useScrollToTop';

// ── Colores por tipo ─────────────────────────────────────────────────────────
const SLOT_BORDER: Record<string, string> = {
  keynote: 'border-l-accent-500',
  presentation: 'border-l-primary-500',
  break: 'border-l-gray-400',
  ceremony: 'border-l-yellow-500',
  workshop: 'border-l-blue-500',
  panel: 'border-l-purple-500',
};
const SLOT_BG_LIGHT: Record<string, string> = {
  keynote: 'bg-accent-50',
  presentation: 'bg-white',
  break: 'bg-gray-50',
  ceremony: 'bg-yellow-50',
  workshop: 'bg-blue-50',
  panel: 'bg-purple-50',
};
const SLOT_TYPE_PILL: Record<string, string> = {
  keynote: 'bg-accent-100 text-accent-700',
  presentation: 'bg-primary-100 text-primary-700',
  break: 'bg-gray-100 text-gray-600',
  ceremony: 'bg-yellow-100 text-yellow-700',
  workshop: 'bg-blue-100 text-blue-700',
  panel: 'bg-purple-100 text-purple-700',
};

// ── Print helpers ────────────────────────────────────────────────────────────
function fmtTimePrint(t: string) { return t?.substring(0, 5) || t; }
function fmtDayPrint(d: string) {
  try { return format(parseISO(d), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }); }
  catch { return d; }
}

function printPublicAgenda(slots: AgendaSlot[], eventName: string, selectedDay?: string, selectedRoom?: string) {
  const win = window.open('', '_blank', 'width=1100,height=800');
  if (!win) return;

  const days = selectedDay
    ? [selectedDay]
    : [...new Set(slots.map((s) => s.day.split('T')[0]))].sort();

  const slotsForDay = (day: string) =>
    slots
      .filter((s) => s.day.split('T')[0] === day && (!selectedRoom || s.room === selectedRoom))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const rowsHtml = (day: string) =>
    slotsForDay(day)
      .map((slot) => {
        const author =
          slot.submission?.authors?.find((a) => a.isCorresponding) ??
          slot.submission?.authors?.[0];
        const name = slot.speakerName || author?.fullName || '';
        const flag = author?.country?.flagEmoji || '';
        const affil = slot.speakerAffiliation || author?.affiliation || '';
        const title = slot.submission?.titleEs || slot.title || '';
        const photo = author?.photoUrl || '';
        const axis = slot.thematicAxis || slot.submission?.thematicAxis;

        return `
        <tr>
          <td class="td-time">
            <span class="t-s">${fmtTimePrint(slot.startTime)}</span>
            <span class="t-d">—</span>
            <span class="t-e">${fmtTimePrint(slot.endTime)}</span>
          </td>
          ${slot.room ? `<td class="td-room"><span class="room-tag">${slot.room}</span></td>` : '<td></td>'}
          <td class="td-content">
            <div class="slot-type-row">
              <span class="type-tag">${SLOT_TYPE_LABELS[slot.type] || slot.type}</span>
              ${axis ? `<span class="axis-tag" style="background:${axis.color || '#007F3A'}">${axis.name}</span>` : ''}
            </div>
            ${title ? `<p class="p-title">${title}</p>` : ''}
            ${name ? `
              <div class="speaker-row">
                ${photo
                  ? `<img src="${photo}" class="s-photo" onerror="this.style.display='none'" />`
                  : `<div class="s-avatar">${name.charAt(0).toUpperCase()}</div>`}
                <div class="s-info">
                  <span class="s-name">${name} ${flag}</span>
                  ${affil ? `<span class="s-affil">${affil}</span>` : ''}
                </div>
              </div>` : ''}
          </td>
        </tr>`;
      })
      .join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Agenda — ${eventName}</title>
  <style>
    @page { size: A4; margin: 18mm 14mm; }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Georgia',serif; color:#111; background:#fff; font-size:10.5pt; }

    .doc-header {
      border-bottom:3px solid #007F3A; padding-bottom:14px; margin-bottom:26px;
      display:flex; align-items:flex-end; justify-content:space-between;
    }
    .ev-sub  { font-size:8pt; color:#999; text-transform:uppercase; letter-spacing:2px; margin-bottom:3px; }
    .ev-name { color:#007F3A; font-size:19pt; font-weight:bold; }
    .room-filter { font-size:8pt; color:#666; text-align:right; }
    .print-date { font-size:8pt; color:#aaa; text-align:right; margin-top:3px; }

    .day-block { margin-bottom:26px; page-break-inside:avoid; }
    .day-hdr {
      background:#007F3A; color:#fff;
      padding:7px 14px; border-radius:4px;
      font-size:11pt; font-weight:bold;
      text-transform:capitalize; margin-bottom:10px;
    }

    table { width:100%; border-collapse:collapse; }
    tr { border-bottom:1px solid #f0ece4; }
    tr:last-child { border-bottom:none; }
    td { padding:8px 9px; vertical-align:top; }

    .td-time {
      width:68px; color:#007F3A; font-family:'Courier New',monospace;
      font-size:8.5pt; font-weight:bold; white-space:nowrap; text-align:center;
    }
    .t-s,.t-e { display:block; }
    .t-d { display:block; color:#ccc; font-weight:normal; }

    .td-room { width:82px; }
    .room-tag { background:#f3f3f3; color:#555; padding:2px 7px; border-radius:8px; font-size:7.5pt; display:inline-block; }

    .slot-type-row { display:flex; gap:6px; align-items:center; margin-bottom:5px; }
    .type-tag { background:#e8f5e9; color:#2e7d32; padding:2px 8px; border-radius:8px; font-size:7.5pt; font-weight:600; }
    .axis-tag { color:#fff; padding:2px 8px; border-radius:8px; font-size:7.5pt; }

    .p-title { font-weight:bold; font-size:10pt; color:#111; margin-bottom:5px; line-height:1.3; }

    .speaker-row { display:flex; align-items:center; gap:7px; }
    .s-photo { width:30px; height:30px; border-radius:50%; object-fit:cover; border:1.5px solid #dde; flex-shrink:0; }
    .s-avatar {
      width:30px; height:30px; border-radius:50%; background:#e8f5e9; color:#007F3A;
      font-weight:bold; display:flex; align-items:center; justify-content:center;
      font-size:13pt; flex-shrink:0;
    }
    .s-info { display:flex; flex-direction:column; }
    .s-name  { font-weight:600; font-size:9pt; }
    .s-affil { font-size:8pt; color:#666; }

    .doc-footer {
      margin-top:28px; padding-top:10px; border-top:1px solid #e4e0d8;
      text-align:center; font-size:7.5pt; color:#bbb;
    }
  </style>
</head>
<body>
  <div class="doc-header">
    <div>
      <div class="ev-sub">Programa Científico</div>
      <div class="ev-name">${eventName}</div>
    </div>
    <div>
      ${selectedRoom ? `<div class="room-filter">Sala: ${selectedRoom}</div>` : ''}
      <div class="print-date">Impreso el ${new Date().toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
  </div>

  ${days.map((day) => `
    <div class="day-block">
      <div class="day-hdr">${fmtDayPrint(day)}</div>
      <table>${rowsHtml(day)}</table>
    </div>`).join('')}

  <div class="doc-footer">Programa generado por el sistema SEMS</div>
</body>
</html>`;

  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 600);
}

// ── SlotCard ─────────────────────────────────────────────────────────────────
function SlotCard({ slot, isDark }: { slot: AgendaSlot; isDark: boolean }) {
  const border = SLOT_BORDER[slot.type] || 'border-l-gray-300';
  const bgLight = SLOT_BG_LIGHT[slot.type] || 'bg-white';
  const colorClass = isDark ? `${border} bg-gray-800` : `${border} ${bgLight}`;

  const textTitle = isDark ? 'text-gray-100' : 'text-gray-900';
  const textMut   = isDark ? 'text-gray-400' : 'text-gray-500';
  const textFade  = isDark ? 'text-gray-500' : 'text-gray-400';
  const divLine   = isDark ? 'bg-gray-600' : 'bg-gray-200';

  const mainAuthor = slot.submission?.authors?.find((a) => a.isCorresponding) ?? slot.submission?.authors?.[0];
  const speakerName  = slot.speakerName || mainAuthor?.fullName;
  const speakerPhoto = mainAuthor?.photoUrl;
  const affiliation  = slot.speakerAffiliation || mainAuthor?.affiliation;
  const flagEmoji    = mainAuthor?.country?.flagEmoji;
  const axis         = slot.thematicAxis || slot.submission?.thematicAxis;
  const titleText    = slot.submission?.titleEs || slot.title || '';

  return (
    <div className={`border-l-4 ${colorClass} rounded-r-xl shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start gap-4 p-4">
        {/* Hora */}
        <div className="flex-shrink-0 text-center min-w-[52px]">
          <Clock size={13} className={`mx-auto mb-1 ${textFade}`} />
          <p className={`text-xs font-mono font-semibold ${textFade}`}>{formatTime(slot.startTime)}</p>
          <div className={`w-px h-4 ${divLine} mx-auto my-1`} />
          <p className={`text-xs font-mono ${textFade}`}>{formatTime(slot.endTime)}</p>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${SLOT_TYPE_PILL[slot.type] || 'bg-gray-100 text-gray-600'}`}>
              {SLOT_TYPE_LABELS[slot.type] || slot.type}
            </span>
            {axis && (
              <span
                className="text-[11px] px-2.5 py-0.5 rounded-full text-white font-medium"
                style={{ backgroundColor: axis.color || '#007F3A' }}
              >
                {axis.name}
              </span>
            )}
            {slot.room && (
              <span className={`text-[11px] flex items-center gap-1 ${textFade}`}>
                <MapPin size={10} /> {slot.room}
              </span>
            )}
          </div>

          {/* Título */}
          {titleText && (
            <h4 className={`font-bold text-sm leading-snug mb-3 ${textTitle}`}>{titleText}</h4>
          )}

          {/* Ponente */}
          {speakerName && (
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                {speakerPhoto ? (
                  <img
                    src={speakerPhoto}
                    alt={speakerName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-sm font-bold text-sm ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-primary-100 text-primary-700'}`}>
                    {speakerName.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Flag badge */}
                {flagEmoji && (
                  <span className="absolute -bottom-0.5 -right-1 text-sm leading-none">{flagEmoji}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-semibold truncate ${textTitle}`}>{speakerName}</p>
                {affiliation && (
                  <p className={`text-xs truncate ${textMut}`}>{affiliation}</p>
                )}
              </div>
            </div>
          )}

          {/* Moderador */}
          {slot.moderatorName && (
            <div className={`flex items-center gap-1.5 mt-2 text-xs ${textMut}`}>
              <User size={11} />
              <span>Moderador/a: <span className="font-medium">{slot.moderatorName}</span></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── AgendaPublic ─────────────────────────────────────────────────────────────
export default function AgendaPublic() {
  const { isDark } = useTheme();
  useScrollToTop();

  const bg      = isDark ? 'bg-gray-950' : 'bg-gray-50';
  const text    = isDark ? 'text-gray-100' : 'text-gray-900';
  const textMut = isDark ? 'text-gray-400' : 'text-gray-500';
  const heading = isDark ? 'text-white' : 'text-primary-900';
  const card    = isDark ? 'bg-gray-800 border-white/10' : 'bg-white border-gray-100';

  const { data: event } = useQuery({ queryKey: ['event-active'], queryFn: eventsApi.getActive });
  const { data: slots, isLoading } = useQuery({
    queryKey: ['agenda-public', event?.id],
    queryFn: () => agendaApi.getPublic(event!.id),
    enabled: !!event?.id && !!event?.isAgendaPublished,
  });

  const slotsByDay = useMemo(() =>
    (slots || []).reduce<Record<string, AgendaSlot[]>>((acc, slot) => {
      const day = slot.day.split('T')[0];
      if (!acc[day]) acc[day] = [];
      acc[day].push(slot);
      return acc;
    }, {}),
    [slots],
  );

  const days = useMemo(() => Object.keys(slotsByDay).sort(), [slotsByDay]);

  const allRooms = useMemo(() => {
    const found = (slots || []).map((s) => s.room).filter(Boolean) as string[];
    return [...new Set(found)];
  }, [slots]);

  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');

  const activeDay = selectedDay || days[0] || '';

  const slotsForView = useMemo(() => {
    const daySlots = (slotsByDay[activeDay] || []).sort((a, b) => a.startTime.localeCompare(b.startTime));
    return selectedRoom ? daySlots.filter((s) => s.room === selectedRoom) : daySlots;
  }, [slotsByDay, activeDay, selectedRoom]);

  // ── Hero ──
  const hero = (
    <div className={`py-16 relative overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-primary-700'}`}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full border border-white/10" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full border border-white/5" />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full border border-white/5" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 text-center">
        <span className={`text-[11px] font-bold uppercase tracking-[0.22em] block mb-3 ${isDark ? 'text-primary-400' : 'text-primary-200'}`}>
          Programa Científico
        </span>
        <h1 className="font-heading font-black text-4xl md:text-5xl text-white mb-3">Agenda del Evento</h1>
        <div className="w-16 h-1 bg-amber-400 rounded-full mx-auto mb-4" />
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
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Calendar size={48} className={isDark ? 'text-gray-500' : 'text-gray-300'} />
          </div>
          <h2 className={`font-heading font-bold text-2xl mb-3 ${heading}`}>Agenda en Construcción</h2>
          <p className={`max-w-md mx-auto ${textMut}`}>
            La agenda del evento estará disponible próximamente. Siga revisando esta sección.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bg}`}>
      {hero}

      <div className="max-w-5xl mx-auto px-4 py-10">
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
          <div className={`text-center py-12 ${textMut}`}>No hay actividades programadas aún.</div>
        ) : (
          <>
            {/* ── Controles: Días + Salas + Imprimir ── */}
            <div className={`sticky top-0 z-20 py-4 mb-6 ${isDark ? 'bg-gray-950' : 'bg-gray-50'} border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              {/* Día tabs */}
              <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
                {days.map((day) => {
                  const date = parseISO(day);
                  const isActive = activeDay === day;
                  const count = slotsByDay[day]?.length || 0;
                  return (
                    <button
                      key={day}
                      onClick={() => { setSelectedDay(day); setSelectedRoom(''); }}
                      className={`flex-shrink-0 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                        isActive
                          ? isDark
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'bg-primary-600 text-white shadow-md'
                          : isDark
                            ? 'bg-gray-800 text-gray-300 border border-white/10 hover:bg-gray-700'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <div className="font-heading font-bold">
                        {format(date, 'EEE', { locale: es }).toUpperCase()}
                      </div>
                      <div className="text-xs opacity-80">{format(date, 'dd MMM', { locale: es })}</div>
                      <div className={`text-[10px] mt-0.5 ${isActive ? 'text-primary-200' : textFade(isDark)}`}>
                        {count} bloques
                      </div>
                    </button>
                  );
                })}

                {/* Spacer + Print button */}
                <div className="flex-1 min-w-4" />
                <button
                  onClick={() => printPublicAgenda(slots || [], event?.name || '', activeDay, selectedRoom)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    isDark
                      ? 'bg-gray-800 text-gray-300 border-white/10 hover:bg-gray-700'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Printer size={14} /> PDF
                </button>
              </div>

              {/* Sala filter pills */}
              {allRooms.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  <span className={`text-xs font-medium ${textMut}`}>Sala:</span>
                  <button
                    onClick={() => setSelectedRoom('')}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      !selectedRoom
                        ? 'bg-primary-600 text-white border-primary-600'
                        : isDark
                          ? 'bg-gray-800 text-gray-300 border-white/10 hover:bg-gray-700'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Todas
                  </button>
                  {allRooms.map((room) => (
                    <button
                      key={room}
                      onClick={() => setSelectedRoom(room === selectedRoom ? '' : room)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        selectedRoom === room
                          ? 'bg-primary-600 text-white border-primary-600'
                          : isDark
                            ? 'bg-gray-800 text-gray-300 border-white/10 hover:bg-gray-700'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {room}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Cabecera del día ── */}
            <div className="flex items-center justify-between mb-6">
              <h2 className={`font-heading font-bold text-xl flex items-center gap-2 ${heading}`}>
                <Calendar size={20} className={isDark ? 'text-primary-400' : 'text-primary-600'} />
                {format(parseISO(activeDay), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
              </h2>
              {selectedRoom && (
                <span className={`text-sm flex items-center gap-1 px-3 py-1 rounded-full border ${isDark ? 'bg-gray-800 text-gray-300 border-white/10' : 'bg-white text-gray-600 border-gray-200'}`}>
                  <MapPin size={12} /> {selectedRoom}
                </span>
              )}
            </div>

            {/* ── Slots ── */}
            {slotsForView.length === 0 ? (
              <div className={`text-center py-10 ${textMut} italic`}>
                No hay bloques {selectedRoom ? `en "${selectedRoom}"` : ''} para este día.
              </div>
            ) : (
              <div className="space-y-3">
                {slotsForView.map((slot) => (
                  <SlotCard key={slot.id} slot={slot} isDark={isDark} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// helper interno para clases de fade
function textFade(isDark: boolean) { return isDark ? 'text-gray-500' : 'text-gray-400'; }
