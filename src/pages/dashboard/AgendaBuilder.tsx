import { useState, useMemo, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  Plus, GripVertical, Trash2, Edit2, Check, Eye, EyeOff, Send, DoorOpen, X,
  Printer, Search, User, MapPin,
} from 'lucide-react';
import { eventsApi } from '../../api/events.api';
import { agendaApi } from '../../api/agenda.api';
import { productTypesApi } from '../../api/index';
import { AgendaSlot, Submission } from '../../types';
import { SLOT_TYPE_LABELS, formatTime } from '../../utils';

const SLOT_COLORS: Record<string, string> = {
  keynote: 'border-accent-400 bg-accent-50',
  presentation: 'border-primary-400 bg-white',
  break: 'border-gray-300 bg-gray-50',
  ceremony: 'border-yellow-400 bg-yellow-50',
  workshop: 'border-blue-400 bg-blue-50',
  panel: 'border-purple-400 bg-purple-50',
};

const SLOT_TYPE_BADGE: Record<string, string> = {
  keynote: 'bg-accent-100 text-accent-700',
  presentation: 'bg-primary-100 text-primary-700',
  break: 'bg-gray-100 text-gray-600',
  ceremony: 'bg-yellow-100 text-yellow-700',
  workshop: 'bg-blue-100 text-blue-700',
  panel: 'bg-purple-100 text-purple-700',
};

// ── helpers de impresión ─────────────────────────────────────────────────────
function fmtTimePrint(t: string) { return t?.substring(0, 5) || t; }
function fmtDayPrint(d: string) {
  try { return format(parseISO(d), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }); }
  catch { return d; }
}

function printAgenda(slots: AgendaSlot[], eventName: string, selectedDay?: string) {
  const win = window.open('', '_blank', 'width=1100,height=800');
  if (!win) return;

  const days = selectedDay
    ? [selectedDay]
    : [...new Set(slots.map((s) => s.day.split('T')[0]))].sort();

  const slotsForDay = (day: string) =>
    slots
      .filter((s) => s.day.split('T')[0] === day)
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
        const axisColor = axis?.color || '#007F3A';

        return `
        <tr>
          <td class="td-time">
            <span class="t-start">${fmtTimePrint(slot.startTime)}</span>
            <span class="t-sep">|</span>
            <span class="t-end">${fmtTimePrint(slot.endTime)}</span>
          </td>
          ${slot.room ? `<td class="td-room"><span class="room-tag">${slot.room}</span></td>` : '<td></td>'}
          <td class="td-content">
            ${title ? `<p class="p-title">${title}</p>` : ''}
            ${name ? `
              <div class="speaker-row">
                ${photo
                  ? `<img src="${photo}" class="s-photo" onerror="this.style.display='none'" />`
                  : `<div class="s-avatar">${name.charAt(0).toUpperCase()}</div>`}
                <div>
                  <span class="s-name">${name} ${flag}</span>
                  ${affil ? `<span class="s-affil">${affil}</span>` : ''}
                </div>
              </div>` : ''}
            ${axis ? `<span class="axis-tag" style="background:${axisColor}">${axis.name}</span>` : ''}
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
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Georgia', serif; color: #111; background: #fff; font-size: 10.5pt; }

    .doc-header {
      display: flex; align-items: flex-end; justify-content: space-between;
      border-bottom: 3px solid #007F3A; padding-bottom: 14px; margin-bottom: 26px;
    }
    .ev-name { color: #007F3A; font-size: 19pt; font-weight: bold; letter-spacing: -0.3px; }
    .ev-sub  { font-size: 9pt; color: #888; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; }
    .print-date { font-size: 8pt; color: #aaa; text-align: right; }

    .day-block { margin-bottom: 26px; page-break-inside: avoid; }
    .day-hdr {
      background: #007F3A; color: #fff;
      padding: 7px 14px; border-radius: 4px;
      font-size: 11.5pt; font-weight: bold;
      text-transform: capitalize; margin-bottom: 10px;
    }

    table { width: 100%; border-collapse: collapse; }
    tr { border-bottom: 1px solid #f0ece4; }
    tr:last-child { border-bottom: none; }
    td { padding: 7px 9px; vertical-align: top; }

    .td-time {
      width: 70px; color: #007F3A; font-family: 'Courier New', monospace;
      font-size: 8.5pt; font-weight: bold; white-space: nowrap; text-align: center;
    }
    .t-start { display: block; }
    .t-sep   { display: block; color: #ccc; font-weight: normal; }
    .t-end   { display: block; }

    .td-room { width: 80px; }
    .room-tag {
      display: inline-block; background: #f3f3f3; color: #555;
      padding: 2px 7px; border-radius: 8px; font-size: 7.5pt;
    }

    .td-content { }
    .p-title { font-weight: bold; font-size: 10pt; color: #111; margin-bottom: 5px; line-height: 1.3; }

    .speaker-row { display: flex; align-items: center; gap: 7px; margin-bottom: 4px; }
    .s-photo {
      width: 28px; height: 28px; border-radius: 50%; object-fit: cover;
      border: 1.5px solid #dde; flex-shrink: 0;
    }
    .s-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      background: #e8f5e9; color: #007F3A; font-weight: bold;
      display: flex; align-items: center; justify-content: center;
      font-size: 12pt; flex-shrink: 0;
    }
    .s-name  { display: block; font-weight: 600; font-size: 9pt; }
    .s-affil { display: block; font-size: 8pt; color: #666; }

    .axis-tag {
      display: inline-block; color: #fff; padding: 2px 8px;
      border-radius: 8px; font-size: 7.5pt; margin-top: 3px;
    }

    .doc-footer {
      margin-top: 28px; padding-top: 10px; border-top: 1px solid #e4e0d8;
      text-align: center; font-size: 7.5pt; color: #bbb;
    }
  </style>
</head>
<body>
  <div class="doc-header">
    <div>
      <div class="ev-sub">Programa Científico</div>
      <div class="ev-name">${eventName}</div>
    </div>
    <div class="print-date">Impreso el ${new Date().toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
  </div>

  ${days
    .map(
      (day) => `
    <div class="day-block">
      <div class="day-hdr">${fmtDayPrint(day)}</div>
      <table>${rowsHtml(day)}</table>
    </div>`,
    )
    .join('')}

  <div class="doc-footer">Generado automáticamente por el sistema SEMS</div>
</body>
</html>`;

  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 600);
}

// ── SubmissionSearchPanel ────────────────────────────────────────────────────
const PANEL_DEFAULT_LIMIT = 30;

function SubmissionSearchPanel({
  submissions, selectedId, onSelect,
}: {
  submissions: Submission[]; selectedId: string; onSelect: (id: string, sub?: Submission) => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      // Sin búsqueda: mostrar seleccionado primero + primeros 30
      const selected = selectedId ? submissions.filter((s) => s.id === selectedId) : [];
      const rest = submissions.filter((s) => s.id !== selectedId).slice(0, PANEL_DEFAULT_LIMIT);
      return [...selected, ...rest];
    }
    return submissions.filter(
      (s) =>
        s.titleEs?.toLowerCase().includes(q) ||
        s.referenceCode?.toLowerCase().includes(q) ||
        s.authors?.some((a) => a.fullName?.toLowerCase().includes(q)),
    );
  }, [submissions, search, selectedId]);

  return (
    <div>
      <div className="relative mb-2">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="form-input pl-8 text-sm"
          placeholder="Buscar por título, código o ponente…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {!search.trim() && submissions.length > PANEL_DEFAULT_LIMIT && (
        <p className="text-[10px] text-gray-400 mb-1.5">
          Mostrando {Math.min(PANEL_DEFAULT_LIMIT, submissions.length)} de {submissions.length} — busca para ver más
        </p>
      )}

      <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
        <button
          onClick={() => onSelect('', undefined)}
          className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition-all ${
            !selectedId ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-transparent hover:bg-gray-50 text-gray-400 italic'
          }`}
        >
          Sin ponencia asociada
        </button>

        {filtered.map((s) => {
          const author = s.authors?.find((a) => a.isCorresponding) ?? s.authors?.[0];
          const isSelected = selectedId === s.id;
          const isReview = s.status === 'under_review';

          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id, s)}
              className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                isSelected
                  ? 'border-primary-400 bg-primary-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {author?.photoUrl ? (
                  <img
                    src={author.photoUrl}
                    alt={author.fullName}
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-gray-200"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 text-primary-600 font-bold text-sm">
                    {author?.fullName?.charAt(0) || <User size={14} />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="text-xs font-mono text-gray-400">{s.referenceCode}</span>
                    {author?.country?.flagEmoji && (
                      <span className="text-sm">{author.country.flagEmoji}</span>
                    )}
                    {isReview ? (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">En revisión</span>
                    ) : (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">Aprobada</span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug mb-1">
                    {s.titleEs}
                  </p>
                  {author && (
                    <p className="text-[11px] text-gray-500 truncate">
                      {author.fullName}
                      {author.affiliation && ` · ${author.affiliation}`}
                    </p>
                  )}
                  {s.thematicAxis && (
                    <span
                      className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: s.thematicAxis.color || '#007F3A' }}
                    >
                      {s.thematicAxis.name}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-center text-xs text-gray-400 py-6 italic">
            No se encontraron ponencias
          </p>
        )}
      </div>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null;
  const getPages = (): (number | '...')[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) pages.push(i);
    if (page < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  };
  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className="px-2.5 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">‹</button>
      {getPages().map((p, i) =>
        p === '...'
          ? <span key={`d${i}`} className="px-1.5 text-gray-400 text-sm">…</span>
          : <button key={p} onClick={() => onChange(p as number)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${page === p ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
              {p}
            </button>
      )}
      <button onClick={() => onChange(page + 1)} disabled={page === total}
        className="px-2.5 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">›</button>
    </div>
  );
}

// ── SlotCard (shared visual, no DnD) ─────────────────────────────────────────
function SlotCard({
  slot, onEdit, onDelete, onTogglePublish, showDate = false, dragHandle = null,
}: {
  slot: AgendaSlot; onEdit: (s: AgendaSlot) => void;
  onDelete: (id: string) => void; onTogglePublish: (s: AgendaSlot) => void;
  showDate?: boolean; dragHandle?: ReactNode;
}) {
  const mainAuthor =
    slot.submission?.authors?.find((a) => a.isCorresponding) ?? slot.submission?.authors?.[0];
  const speakerName = slot.speakerName || mainAuthor?.fullName;
  const speakerPhoto = mainAuthor?.photoUrl;
  const flagEmoji = mainAuthor?.country?.flagEmoji;
  const affiliation = slot.speakerAffiliation || mainAuthor?.affiliation;
  const axis = slot.thematicAxis || slot.submission?.thematicAxis;
  const initials = speakerName
    ? speakerName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
    : null;

  return (
    <div className={`border-l-4 ${SLOT_COLORS[slot.type] || 'border-gray-300 bg-white'} rounded-r-xl shadow-sm group hover:shadow-md transition-shadow p-3 flex items-center gap-3`}>
      {/* Drag handle or spacer */}
      {dragHandle ?? <div className="w-4 flex-shrink-0" />}

      {/* Time column */}
      <div className="text-center min-w-[52px] flex-shrink-0">
        {showDate && (
          <p className="text-[10px] text-gray-400 font-medium leading-none mb-0.5">
            {format(parseISO(slot.day.split('T')[0]), 'dd MMM', { locale: es })}
          </p>
        )}
        <p className="text-[11px] font-mono text-gray-500 font-medium">{formatTime(slot.startTime)}</p>
        <div className="w-px h-3 bg-gray-200 mx-auto my-0.5" />
        <p className="text-[11px] font-mono text-gray-500">{formatTime(slot.endTime)}</p>
      </div>

      {/* Speaker photo — perfectly circular */}
      <div className="w-16 h-16 flex-shrink-0 rounded-full overflow-hidden relative bg-gray-100">
        {initials ? (
          <div className="absolute inset-0 flex items-center justify-center bg-primary-100">
            <span className="text-sm font-bold text-primary-700 leading-none">{initials}</span>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <User size={18} className="text-gray-300" />
          </div>
        )}
        {speakerPhoto && (
          <img
            src={speakerPhoto}
            alt={speakerName || ''}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${SLOT_TYPE_BADGE[slot.type] || 'bg-gray-100 text-gray-600'}`}>
            {SLOT_TYPE_LABELS[slot.type] || slot.type}
          </span>
          {axis && (
            <span className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium"
              style={{ backgroundColor: axis.color || '#007F3A' }}>
              {axis.name}
            </span>
          )}
          {slot.room && (
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
              <MapPin size={9} /> {slot.room}
            </span>
          )}
          {slot.isPublished && (
            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Publicado</span>
          )}
        </div>
        <p className="text-sm font-semibold text-gray-800 truncate leading-snug">
          {slot.submission?.titleEs || slot.title || <span className="text-gray-400 italic">Sin título</span>}
        </p>
        {speakerName && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs text-gray-600 truncate">{speakerName}</span>
            {flagEmoji && <span className="text-sm leading-none">{flagEmoji}</span>}
            {affiliation && <span className="text-xs text-gray-400 truncate hidden sm:block">· {affiliation}</span>}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={() => onTogglePublish(slot)} title={slot.isPublished ? 'Quitar publicación' : 'Publicar'}
          className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100">
          {slot.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button onClick={() => onEdit(slot)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100">
          <Edit2 size={14} />
        </button>
        <button onClick={() => onDelete(slot.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ── SortableSlot (DnD wrapper) ────────────────────────────────────────────────
function SortableSlot({
  slot, onEdit, onDelete, onTogglePublish,
}: {
  slot: AgendaSlot; onEdit: (s: AgendaSlot) => void;
  onDelete: (id: string) => void; onTogglePublish: (s: AgendaSlot) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: slot.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style}>
      <SlotCard
        slot={slot} onEdit={onEdit} onDelete={onDelete} onTogglePublish={onTogglePublish}
        dragHandle={
          <div {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500 flex-shrink-0">
            <GripVertical size={16} />
          </div>
        }
      />
    </div>
  );
}

// ── RoomsSidebar ─────────────────────────────────────────────────────────────
function RoomsSidebar({
  rooms, selectedRoom, onSelect, onSave,
}: {
  rooms: string[]; selectedRoom: string;
  onSelect: (r: string) => void; onSave: (r: string[]) => void;
}) {
  const [newRoom, setNewRoom] = useState('');

  const addRoom = () => {
    const t = newRoom.trim();
    if (!t || rooms.includes(t)) return;
    const updated = [...rooms, t];
    onSave(updated);
    setNewRoom('');
  };

  const removeRoom = (r: string) => {
    onSave(rooms.filter((x) => x !== r));
    if (selectedRoom === r) onSelect('');
  };

  return (
    <div className="space-y-0.5">
      {rooms.length === 0 && (
        <p className="text-xs text-gray-400 italic px-1 pb-1">Sin salas configuradas</p>
      )}
      {rooms.map((r) => {
        const isSelected = selectedRoom === r;
        return (
          <div key={r} className="flex items-center gap-1 group">
            <button
              onClick={() => onSelect(isSelected ? '' : r)}
              className={`flex-1 text-left px-3 py-2 rounded-xl text-sm transition-all ${
                isSelected
                  ? 'bg-primary-600 text-white font-semibold shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {r}
            </button>
            <button
              onClick={() => removeRoom(r)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-300 hover:text-red-500 flex-shrink-0"
              title="Eliminar sala"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
      {/* Add new room */}
      <div className="flex gap-1.5 pt-2">
        <input
          className="form-input text-xs flex-1 py-1.5"
          placeholder="Nueva sala…"
          value={newRoom}
          onChange={(e) => setNewRoom(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addRoom()}
        />
        <button
          onClick={addRoom}
          className="btn-primary btn-sm px-2.5 py-1.5 flex-shrink-0"
          title="Agregar sala"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}

// ── SlotForm types ────────────────────────────────────────────────────────────
interface SlotForm {
  type: string; day: string; startTime: string; endTime: string;
  room: string; title: string; submissionId: string; thematicAxisId: string;
  speakerName: string; speakerAffiliation: string; moderatorName: string; description: string;
}
const EMPTY_FORM: SlotForm = {
  type: 'presentation', day: '', startTime: '', endTime: '', room: '', title: '',
  submissionId: '', thematicAxisId: '', speakerName: '', speakerAffiliation: '',
  moderatorName: '', description: '',
};

// ── Main component ────────────────────────────────────────────────────────────
export default function AgendaBuilder() {
  const qc = useQueryClient();
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AgendaSlot | null>(null);
  const [form, setForm] = useState<SlotForm>(EMPTY_FORM);
  const [page, setPage] = useState(1);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { data: event } = useQuery({ queryKey: ['event-active'], queryFn: eventsApi.getActive });

  const { data: slots = [] } = useQuery({
    queryKey: ['agenda-all', event?.id],
    queryFn: () => agendaApi.getAll(event!.id),
    enabled: !!event?.id,
  });

  // Cargar tipos de producción para filtrar ponencias / comunicaciones orales
  const { data: productTypes = [] } = useQuery({
    queryKey: ['product-types'],
    queryFn: () => productTypesApi.getAll(true),
  });

  // IDs de tipos que corresponden a ponencia o comunicación oral
  const ponenciaTypeIds = useMemo(() => {
    const KEYWORDS = ['ponencia', 'comunicaci', 'oral'];
    return new Set(
      productTypes
        .filter((pt) => KEYWORDS.some((kw) => pt.name.toLowerCase().includes(kw)))
        .map((pt) => pt.id),
    );
  }, [productTypes]);

  const { data: eligibleSubmissions = [] } = useQuery<Submission[]>({
    queryKey: ['agenda-eligible', event?.id],
    queryFn: () => agendaApi.getEligibleSubmissions(event!.id),
    enabled: !!event?.id,
    select: (data) => {
      // Si ya tenemos los tipos cargados, filtrar por tipo de producción.
      // Si aún no hay tipos (carga inicial), mostrar todo para no bloquear.
      if (ponenciaTypeIds.size === 0) return data;
      return data.filter((s) => {
        const primaryMatch = ponenciaTypeIds.has(s.productTypeId || '');
        const secondaryMatch = (s.productTypeIds || []).some((id) => ponenciaTypeIds.has(id));
        return primaryMatch || secondaryMatch;
      });
    },
  });

  const eventDays = useMemo(() => {
    if (!event?.startDate || !event?.endDate) return [];
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const result: string[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      result.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  }, [event]);

  const slotDays = useMemo(() => [...new Set(slots.map((s) => s.day.split('T')[0]))].sort(), [slots]);
  const allDays = eventDays.length > 0 ? eventDays : slotDays;

  const PAGE_SIZE = 12;

  const slotsFiltered = useMemo(() => {
    let result = [...slots];
    if (selectedDay) result = result.filter((s) => s.day.split('T')[0] === selectedDay);
    if (selectedRoom) result = result.filter((s) => s.room === selectedRoom);
    return result.sort((a, b) => {
      const d = a.day.localeCompare(b.day);
      if (d !== 0) return d;
      const t = a.startTime.localeCompare(b.startTime);
      if (t !== 0) return t;
      return a.displayOrder - b.displayOrder;
    });
  }, [slots, selectedDay, selectedRoom]);

  const totalPages = Math.max(1, Math.ceil(slotsFiltered.length / PAGE_SIZE));

  const slotsPage = useMemo(
    () => selectedDay
      ? slotsFiltered
      : slotsFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [slotsFiltered, page, selectedDay],
  );

  const roomsAvailable = useMemo(() => {
    const source = selectedDay ? slots.filter((s) => s.day.split('T')[0] === selectedDay) : slots;
    return [...new Set(source.map((s) => s.room).filter(Boolean))] as string[];
  }, [slots, selectedDay]);

  const rooms = event?.rooms ?? [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Partial<AgendaSlot>) => agendaApi.create(data),
    onSuccess: () => { toast.success('Bloque creado'); qc.invalidateQueries({ queryKey: ['agenda-all'] }); closeForm(); },
    onError: () => toast.error('Error al crear bloque'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AgendaSlot> }) => agendaApi.update(id, data),
    onSuccess: () => { toast.success('Bloque actualizado'); qc.invalidateQueries({ queryKey: ['agenda-all'] }); closeForm(); },
    onError: () => toast.error('Error al actualizar'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => agendaApi.remove(id),
    onSuccess: () => { toast.success('Bloque eliminado'); qc.invalidateQueries({ queryKey: ['agenda-all'] }); },
  });
  const publishMutation = useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) =>
      publish ? agendaApi.publish(id) : agendaApi.unpublish(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agenda-all'] }),
  });
  const publishAllMutation = useMutation({
    mutationFn: () => agendaApi.publishAll(event!.id),
    onSuccess: () => { toast.success('Toda la agenda publicada'); qc.invalidateQueries({ queryKey: ['agenda-all'] }); },
  });
  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => agendaApi.reorder(orderedIds),
  });

  const closeForm = () => { setShowForm(false); setEditingSlot(null); setForm(EMPTY_FORM); };

  const handleDragEnd = (ev: DragEndEvent) => {
    const { active, over } = ev;
    if (!over || active.id === over.id) return;
    const oldIndex = slotsPage.findIndex((s) => s.id === active.id);
    const newIndex = slotsPage.findIndex((s) => s.id === over.id);
    reorderMutation.mutate(arrayMove(slotsPage, oldIndex, newIndex).map((s) => s.id));
  };

  const openEdit = (slot: AgendaSlot) => {
    setEditingSlot(slot);
    setForm({
      type: slot.type, day: slot.day.split('T')[0], startTime: slot.startTime,
      endTime: slot.endTime, room: slot.room || '', title: slot.title || '',
      submissionId: slot.submissionId || '', thematicAxisId: slot.thematicAxisId || '',
      speakerName: slot.speakerName || '', speakerAffiliation: slot.speakerAffiliation || '',
      moderatorName: slot.moderatorName || '', description: slot.description || '',
    });
    setShowForm(true);
  };

  const handleSave = () => {
    const payload = {
      ...form,
      eventId: event!.id,
      submissionId: form.submissionId || undefined,
      thematicAxisId: form.thematicAxisId || undefined,
    } as any;
    if (editingSlot) updateMutation.mutate({ id: editingSlot.id, data: payload });
    else createMutation.mutate(payload);
  };

  const handleSaveRooms = async (r: string[]) => {
    try {
      await eventsApi.update(event!.id, { rooms: r } as any);
      qc.invalidateQueries({ queryKey: ['event-active'] });
      toast.success('Salas guardadas');
    } catch { toast.error('Error al guardar salas'); }
  };

  const handleSelectSubmission = (id: string, sub?: Submission) => {
    if (!id) {
      setForm((prev) => ({ ...prev, submissionId: '' }));
      return;
    }
    const corrAuthor = sub?.authors?.find((a) => a.isCorresponding) ?? sub?.authors?.[0];
    setForm((prev) => ({
      ...prev,
      submissionId: id,
      thematicAxisId: sub?.thematicAxis?.id ?? sub?.thematicAxisId ?? prev.thematicAxisId,
      speakerName: corrAuthor?.fullName ?? prev.speakerName,
      speakerAffiliation: corrAuthor?.affiliation ?? prev.speakerAffiliation,
    }));
  };

  const isPresentationType = form.type === 'presentation' || form.type === 'keynote';

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading font-bold text-2xl text-gray-900">Agenda del Evento</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {slots.length} bloques · {eligibleSubmissions.length} ponencias disponibles
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => printAgenda(slots, event?.name || 'Evento', selectedDay || undefined)}
            className="btn-outline btn-sm flex items-center gap-1.5"
          >
            <Printer size={14} /> Imprimir PDF
          </button>
          <button
            onClick={() => { setEditingSlot(null); setForm({ ...EMPTY_FORM, day: selectedDay }); setShowForm(true); }}
            className="btn-primary btn-sm flex items-center gap-1.5 text-white"
          >
            <Plus size={15} /> Agregar Bloque
          </button>
          <button
            onClick={() => publishAllMutation.mutate()}
            disabled={publishAllMutation.isPending}
            className="btn-outline btn-sm flex items-center gap-1.5"
          >
            <Send size={14} /> Publicar Todo
          </button>
        </div>
      </div>

      {/* ── Layout principal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Días + Salas */}
        <div className="card !p-4 lg:col-span-1 space-y-5">
          {/* Días del Evento */}
          <div>
            <h3 className="font-heading font-semibold text-gray-500 text-xs uppercase tracking-wide mb-3">
              Días del Evento
            </h3>
            <div className="space-y-0.5">
              {/* Ver todos */}
              <button
                onClick={() => { setSelectedDay(''); setSelectedRoom(''); setPage(1); }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                  !selectedDay ? 'bg-primary-600 text-white font-semibold shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium">Todos los días</div>
                <div className={`text-xs ${!selectedDay ? 'text-primary-100' : 'text-gray-400'}`}>
                  {slots.length} {slots.length === 1 ? 'bloque' : 'bloques'}
                </div>
              </button>
              {allDays.map((day) => {
                const count = slots.filter((s) => s.day.split('T')[0] === day).length;
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => { setSelectedDay(day); setSelectedRoom(''); setPage(1); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                      isSelected
                        ? 'bg-primary-600 text-white font-semibold shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{format(parseISO(day), 'EEE dd MMM', { locale: es })}</div>
                    <div className={`text-xs ${isSelected ? 'text-primary-100' : 'text-gray-400'}`}>
                      {count} {count === 1 ? 'bloque' : 'bloques'}
                    </div>
                  </button>
                );
              })}
              {slotDays.filter((d) => !allDays.includes(d)).map((day) => (
                <button
                  key={day}
                  onClick={() => { setSelectedDay(day); setSelectedRoom(''); setPage(1); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                    selectedDay === day ? 'bg-primary-600 text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {format(parseISO(day), 'EEE dd MMM', { locale: es })}
                </button>
              ))}
            </div>
          </div>

          {/* Salas / Ambientes */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <DoorOpen size={13} className="text-primary-600" />
              <h3 className="font-heading font-semibold text-gray-500 text-xs uppercase tracking-wide">
                Salas / Ambientes
              </h3>
              {rooms.length > 0 && (
                <span className="ml-auto bg-primary-100 text-primary-700 text-xs px-1.5 py-0.5 rounded-full">
                  {rooms.length}
                </span>
              )}
            </div>
            <RoomsSidebar
              rooms={rooms}
              selectedRoom={selectedRoom}
              onSelect={setSelectedRoom}
              onSave={handleSaveRooms}
            />
          </div>
        </div>

        {/* Bloques */}
        <div className="lg:col-span-3 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-heading font-bold text-gray-800 text-lg">
              {selectedDay
                ? format(parseISO(selectedDay), "EEEE, dd 'de' MMMM", { locale: es })
                : 'Todos los bloques'}
            </h3>
            <div className="flex items-center gap-2">
              {(selectedDay || selectedRoom) && (
                <button
                  onClick={() => { setSelectedDay(''); setSelectedRoom(''); setPage(1); }}
                  className="text-xs text-primary-600 hover:text-primary-700 hover:underline font-medium"
                >
                  Ver todos
                </button>
              )}
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                {slotsFiltered.length} {slotsFiltered.length === 1 ? 'bloque' : 'bloques'}
              </span>
            </div>
          </div>

          {/* Room filter pills */}
          {roomsAvailable.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400">Sala:</span>
              <button
                onClick={() => { setSelectedRoom(''); setPage(1); }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                  !selectedRoom ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                Todas
              </button>
              {roomsAvailable.map((r) => (
                <button
                  key={r}
                  onClick={() => { setSelectedRoom(r === selectedRoom ? '' : r); setPage(1); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                    selectedRoom === r ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {slotsPage.length === 0 ? (
            <div className="card text-center py-10 text-gray-400 border-2 border-dashed">
              No hay bloques{selectedDay ? ' para este día' : ''}{selectedRoom ? ` en "${selectedRoom}"` : ''}. Haga clic en "Agregar Bloque".
            </div>
          ) : selectedDay ? (
            /* DnD sortable view — specific day */
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={slotsPage.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {slotsPage.map((slot) => (
                    <SortableSlot
                      key={slot.id} slot={slot} onEdit={openEdit}
                      onDelete={(id) => { if (confirm('¿Eliminar este bloque?')) deleteMutation.mutate(id); }}
                      onTogglePublish={(s) => publishMutation.mutate({ id: s.id, publish: !s.isPublished })}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            /* Static paginated view — all slots */
            <div className="space-y-2">
              {slotsPage.map((slot) => (
                <SlotCard
                  key={slot.id} slot={slot} showDate onEdit={openEdit}
                  onDelete={(id) => { if (confirm('¿Eliminar este bloque?')) deleteMutation.mutate(id); }}
                  onTogglePublish={(s) => publishMutation.mutate({ id: s.id, publish: !s.isPublished })}
                />
              ))}
            </div>
          )}

          {/* Pagination — only for all-view */}
          {!selectedDay && <Pagination page={page} total={totalPages} onChange={setPage} />}
        </div>
      </div>

      {/* ── Modal formulario ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4 flex flex-col max-h-[92vh]">
            {/* Modal header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h3 className="font-heading font-bold text-lg text-gray-900">
                {editingSlot ? 'Editar Bloque' : 'Nuevo Bloque de Agenda'}
              </h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Fila 1: Tipo + Fecha */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Tipo *</label>
                  <select
                    className="form-input"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    {Object.entries(SLOT_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Fecha *</label>
                  {allDays.length > 0 ? (
                    <select
                      className="form-input"
                      value={form.day}
                      onChange={(e) => setForm({ ...form, day: e.target.value })}
                    >
                      <option value="">Seleccionar fecha…</option>
                      {allDays.map((d) => (
                        <option key={d} value={d}>
                          {format(parseISO(d), "EEEE d 'de' MMMM", { locale: es })}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="date"
                      className="form-input"
                      value={form.day}
                      onChange={(e) => setForm({ ...form, day: e.target.value })}
                    />
                  )}
                </div>
              </div>

              {/* Fila 2: Horas + Sala */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="form-label">Hora inicio *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Hora fin *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Sala</label>
                  {rooms.length > 0 ? (
                    <select
                      className="form-input"
                      value={form.room}
                      onChange={(e) => setForm({ ...form, room: e.target.value })}
                    >
                      <option value="">Sin sala</option>
                      {[...new Set([...rooms, ...(form.room ? [form.room] : [])])].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="form-input"
                      placeholder="Sala A…"
                      value={form.room}
                      onChange={(e) => setForm({ ...form, room: e.target.value })}
                    />
                  )}
                </div>
              </div>

              {/* Título (para recesos/ceremonias) */}
              {!isPresentationType && (
                <div>
                  <label className="form-label">Título</label>
                  <input
                    className="form-input"
                    placeholder="Almuerzo, Apertura, Mesa redonda…"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
              )}

              {/* Búsqueda de ponencia */}
              {isPresentationType && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="form-label mb-0">Ponencia</label>
                    <span className="text-xs text-gray-400">
                      — {eligibleSubmissions.length} disponibles (aprobadas · en revisión)
                    </span>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                    <SubmissionSearchPanel
                      submissions={eligibleSubmissions}
                      selectedId={form.submissionId}
                      onSelect={handleSelectSubmission}
                    />
                  </div>
                  {form.submissionId &&
                    eligibleSubmissions.find((s) => s.id === form.submissionId)?.status === 'under_review' && (
                      <p className="text-xs text-amber-600 mt-1.5 bg-amber-50 rounded-lg px-2.5 py-1.5">
                        ⚠ Esta ponencia aún no está aprobada. Quedará marcada en la agenda hasta su aprobación.
                      </p>
                    )}
                </div>
              )}

              {/* Eje temático */}
              {event?.thematicAxes && (
                <div>
                  <label className="form-label">Eje Temático</label>
                  <select
                    className="form-input"
                    value={form.thematicAxisId}
                    onChange={(e) => setForm({ ...form, thematicAxisId: e.target.value })}
                  >
                    <option value="">Sin eje específico</option>
                    {event.thematicAxes.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Ponente */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Ponente {isPresentationType && <span className="font-normal text-gray-400">(auto-completado al seleccionar ponencia)</span>}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Nombre</label>
                    <input
                      className="form-input"
                      placeholder="Nombre completo"
                      value={form.speakerName}
                      onChange={(e) => setForm({ ...form, speakerName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Institución</label>
                    <input
                      className="form-input"
                      placeholder="Universidad / Institución"
                      value={form.speakerAffiliation}
                      onChange={(e) => setForm({ ...form, speakerAffiliation: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Moderador/a</label>
                  <input
                    className="form-input"
                    value={form.moderatorName}
                    onChange={(e) => setForm({ ...form, moderatorName: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="p-5 pt-0 flex gap-3 justify-end border-t border-gray-100 flex-shrink-0 mt-2">
              <button onClick={closeForm} className="btn-outline btn-sm">Cancelar</button>
              <button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn-primary btn-sm flex items-center gap-1.5"
              >
                <Check size={14} /> {editingSlot ? 'Actualizar' : 'Crear Bloque'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
