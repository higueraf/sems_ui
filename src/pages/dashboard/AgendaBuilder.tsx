import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { eventsApi } from '../../api/events.api';
import { agendaApi } from '../../api/agenda.api';
import { submissionsApi } from '../../api/submissions.api';
import { productTypesApi } from '../../api/index';
import { AgendaSlot, Submission } from '../../types';
import { SLOT_TYPE_LABELS, formatTime } from '../../utils';

const SLOT_COLORS: Record<string, string> = {
  keynote: 'border-accent-400', presentation: 'border-primary-400', break: 'border-gray-300',
  ceremony: 'border-yellow-400', workshop: 'border-blue-400', panel: 'border-purple-400',
};

function SubmissionStatusBadge({ status }: { status: string }) {
  if (status === 'under_review')
    return <span className="text-xs bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded font-medium">En revisión</span>;
  if (status === 'approved')
    return <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">Aprobada</span>;
  return null;
}

function SortableSlot({ slot, onEdit, onDelete, onTogglePublish }: {
  slot: AgendaSlot; onEdit: (s: AgendaSlot) => void; onDelete: (id: string) => void; onTogglePublish: (s: AgendaSlot) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slot.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const subStatus = slot.submission?.status;
  return (
    <div ref={setNodeRef} style={style}
      className={`border-l-4 ${SLOT_COLORS[slot.type] || 'border-gray-300'} rounded-r-lg shadow-sm p-3 flex items-center gap-3 group ${subStatus === 'under_review' ? 'bg-pink-50' : 'bg-white'}`}>
      <div {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500 p-1">
        <GripVertical size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-gray-400">{formatTime(slot.startTime)}–{formatTime(slot.endTime)}</span>
          {slot.room && <span className="text-xs text-gray-400">| {slot.room}</span>}
          <span className="badge bg-gray-100 text-gray-600 text-xs">{SLOT_TYPE_LABELS[slot.type] || slot.type}</span>
          {slot.isPublished && <span className="badge bg-green-100 text-green-700 text-xs">Publicado</span>}
          {subStatus && <SubmissionStatusBadge status={subStatus} />}
        </div>
        <p className="text-sm font-medium text-gray-800 mt-0.5 truncate">{slot.submission?.titleEs || slot.title || '—'}</p>
        {(slot.speakerName || slot.submission?.authors?.[0]?.fullName) && (
          <p className="text-xs text-gray-400 mt-0.5">
            {slot.speakerName || slot.submission?.authors?.find((a) => a.isCorresponding)?.fullName}
            {slot.submission?.authors?.find((a) => a.isCorresponding)?.country?.flagEmoji && (
              <span className="ml-1">{slot.submission!.authors!.find((a) => a.isCorresponding)!.country!.flagEmoji}</span>
            )}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onTogglePublish(slot)} title={slot.isPublished ? 'Quitar publicación' : 'Publicar'} className="p-1.5 text-gray-400 hover:text-primary-600 rounded">
          {slot.isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
        <button onClick={() => onEdit(slot)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded"><Edit2 size={15} /></button>
        <button onClick={() => onDelete(slot.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><Trash2 size={15} /></button>
      </div>
    </div>
  );
}

interface SlotForm {
  type: string; day: string; startTime: string; endTime: string;
  room: string; title: string; submissionId: string; thematicAxisId: string;
  speakerName: string; speakerAffiliation: string; moderatorName: string; description: string;
}
const EMPTY_FORM: SlotForm = {
  type: 'presentation', day: '', startTime: '', endTime: '', room: '', title: '',
  submissionId: '', thematicAxisId: '', speakerName: '', speakerAffiliation: '', moderatorName: '', description: '',
};

function RoomsManager({ rooms, onSave }: { rooms: string[]; onSave: (rooms: string[]) => void }) {
  const [list, setList] = useState<string[]>([...rooms]);
  const [newRoom, setNewRoom] = useState('');
  const add = () => {
    const trimmed = newRoom.trim();
    if (!trimmed || list.includes(trimmed)) return;
    setList([...list, trimmed]);
    setNewRoom('');
  };
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        {list.length === 0 && <p className="text-xs text-gray-400 italic">Sin salas configuradas</p>}
        {list.map((r) => (
          <div key={r} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-1.5 text-sm">
            <span className="text-gray-800">{r}</span>
            <button onClick={() => setList(list.filter((x) => x !== r))} className="text-gray-400 hover:text-red-500 p-0.5"><X size={14} /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="form-input text-sm flex-1" placeholder="Nombre de la sala..." value={newRoom}
          onChange={(e) => setNewRoom(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button onClick={add} className="btn-primary btn-sm px-3"><Plus size={15} /></button>
      </div>
      <button onClick={() => onSave(list)} className="btn-primary btn-sm w-full flex items-center justify-center gap-1">
        <Check size={14} /> Guardar salas
      </button>
    </div>
  );
}

export default function AgendaBuilder() {
  const qc = useQueryClient();
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AgendaSlot | null>(null);
  const [form, setForm] = useState<SlotForm>(EMPTY_FORM);
  const [showRooms, setShowRooms] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { data: event } = useQuery({ queryKey: ['event-active'], queryFn: eventsApi.getActive });
  const { data: slots = [] } = useQuery({
    queryKey: ['agenda-all', event?.id],
    queryFn: () => agendaApi.getAll(event!.id),
    enabled: !!event?.id,
  });
  const { data: productTypes = [] } = useQuery({
    queryKey: ['product-types'],
    queryFn: () => productTypesApi.getAll(true),
  });
  const ponenciaTypeId = useMemo(
    () => productTypes.find((p) => p.name.toLowerCase().includes('ponencia'))?.id,
    [productTypes],
  );
  const { data: submissions = [] } = useQuery<Submission[]>({
    queryKey: ['submissions-agenda', event?.id, ponenciaTypeId],
    queryFn: () => submissionsApi.getAll({ eventId: event?.id, ...(ponenciaTypeId ? { productTypeId: ponenciaTypeId } : {}) }),
    enabled: !!event?.id,
    select: (data) => data.filter((s) => {
      const validStatuses = ['approved', 'under_review', 'scheduled'];
      if (validStatuses.includes(s.status)) return true;
      if (ponenciaTypeId) {
        const ptStatus = (s.productStatuses as Record<string, string> | undefined)?.[ponenciaTypeId];
        return !!ptStatus && validStatuses.includes(ptStatus);
      }
      return false;
    }),
  });

  const eventDays = useMemo(() => {
    if (!event?.startDate || !event?.endDate) return [];
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const result: string[] = [];
    const cur = new Date(start);
    while (cur <= end) { result.push(cur.toISOString().split('T')[0]); cur.setDate(cur.getDate() + 1); }
    return result;
  }, [event]);

  const days = useMemo(() => [...new Set(slots.map((s) => s.day.split('T')[0]))].sort(), [slots]);
  const slotsForDay = useMemo(() =>
    slots.filter((s) => s.day.split('T')[0] === selectedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.displayOrder - b.displayOrder),
    [slots, selectedDay]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<AgendaSlot>) => agendaApi.create(data),
    onSuccess: () => { toast.success('Bloque creado'); qc.invalidateQueries({ queryKey: ['agenda-all'] }); setShowForm(false); setForm(EMPTY_FORM); },
    onError: () => toast.error('Error al crear bloque'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AgendaSlot> }) => agendaApi.update(id, data),
    onSuccess: () => { toast.success('Bloque actualizado'); qc.invalidateQueries({ queryKey: ['agenda-all'] }); setShowForm(false); setEditingSlot(null); setForm(EMPTY_FORM); },
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

  const handleDragEnd = (ev: DragEndEvent) => {
    const { active, over } = ev;
    if (!over || active.id === over.id) return;
    const oldIndex = slotsForDay.findIndex((s) => s.id === active.id);
    const newIndex = slotsForDay.findIndex((s) => s.id === over.id);
    reorderMutation.mutate(arrayMove(slotsForDay, oldIndex, newIndex).map((s) => s.id));
  };

  const openEdit = (slot: AgendaSlot) => {
    setEditingSlot(slot);
    setForm({
      type: slot.type, day: slot.day.split('T')[0], startTime: slot.startTime, endTime: slot.endTime,
      room: slot.room || '', title: slot.title || '', submissionId: slot.submissionId || '',
      thematicAxisId: slot.thematicAxisId || '', speakerName: slot.speakerName || '',
      speakerAffiliation: slot.speakerAffiliation || '', moderatorName: slot.moderatorName || '',
      description: slot.description || '',
    });
    setShowForm(true);
  };

  const handleSave = () => {
    const payload = { ...form, eventId: event!.id, submissionId: form.submissionId || undefined, thematicAxisId: form.thematicAxisId || undefined } as any;
    if (editingSlot) updateMutation.mutate({ id: editingSlot.id, data: payload });
    else createMutation.mutate(payload);
  };

  const handleSaveRooms = async (rooms: string[]) => {
    try {
      await eventsApi.update(event!.id, { rooms } as any);
      qc.invalidateQueries({ queryKey: ['event-active'] });
      toast.success('Salas guardadas');
      setShowRooms(false);
    } catch { toast.error('Error al guardar salas'); }
  };

  const rooms = event?.rooms ?? [];
  const selectedSubmission = submissions.find((s) => s.id === form.submissionId);
  const allDays = eventDays.length > 0 ? eventDays : days;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-heading font-bold text-2xl text-gray-900">Agenda del Evento</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowRooms(!showRooms)} className="btn-outline btn-sm flex items-center gap-1">
            <DoorOpen size={15} /> Salas {rooms.length > 0 && `(${rooms.length})`}
          </button>
          <button
            onClick={() => { setEditingSlot(null); setForm({ ...EMPTY_FORM, day: selectedDay }); setShowForm(true); }}
            className="btn-primary btn-sm flex items-center gap-1 text-white"
          >
            <Plus size={16} /> Agregar Bloque
          </button>
          <button onClick={() => publishAllMutation.mutate()} className="btn-outline btn-sm flex items-center gap-1">
            <Send size={15} /> Publicar Todo
          </button>
        </div>
      </div>

      {/* Panel salas */}
      {showRooms && (
        <div className="card border-l-4 border-l-primary-400">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-semibold text-gray-800 flex items-center gap-2">
              <DoorOpen size={16} className="text-primary-600" /> Gestionar Salas / Ambientes
            </h3>
            <button onClick={() => setShowRooms(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <RoomsManager rooms={rooms} onSave={handleSaveRooms} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Días */}
        <div className="card !p-4 lg:col-span-1">
          <h3 className="font-heading font-semibold text-gray-700 text-sm mb-3">Días del Evento</h3>
          {allDays.map((day) => {
            const count = slots.filter((s) => s.day.split('T')[0] === day).length;
            const isSelected = selectedDay === day;
            return (
              <button key={day} onClick={() => setSelectedDay(day)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm mb-1 transition-all ${isSelected ? 'bg-primary-500 text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>
                <div className="font-medium">{format(parseISO(day), 'EEE dd MMM', { locale: es })}</div>
                <div className={`text-xs ${isSelected ? 'text-primary-100' : 'text-gray-400'}`}>{count} bloques</div>
              </button>
            );
          })}
          {days.filter((d) => !allDays.includes(d)).map((day) => (
            <button key={day} onClick={() => setSelectedDay(day)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-all ${selectedDay === day ? 'bg-primary-500 text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>
              {format(parseISO(day), 'EEE dd MMM', { locale: es })}
            </button>
          ))}
        </div>

        {/* Bloques */}
        <div className="lg:col-span-3 space-y-3">
          {!selectedDay ? (
            <div className="card text-center py-12 text-gray-400">Seleccione un día para gestionar los bloques de la agenda</div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-semibold text-gray-800">{format(parseISO(selectedDay), "EEEE, dd 'de' MMMM", { locale: es })}</h3>
                <span className="text-sm text-gray-400">{slotsForDay.length} bloques</span>
              </div>
              {slotsForDay.length === 0 ? (
                <div className="card text-center py-10 text-gray-400">No hay bloques para este día. Haga clic en "Agregar Bloque".</div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={slotsForDay.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {slotsForDay.map((slot) => (
                        <SortableSlot key={slot.id} slot={slot} onEdit={openEdit}
                          onDelete={(id) => { if (confirm('¿Eliminar este bloque?')) deleteMutation.mutate(id); }}
                          onTogglePublish={(s) => publishMutation.mutate({ id: s.id, publish: !s.isPublished })}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl my-4">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-heading font-bold text-lg">{editingSlot ? 'Editar Bloque' : 'Nuevo Bloque de Agenda'}</h3>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Tipo *</label>
                  <select className="form-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {Object.entries(SLOT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Fecha *</label>
                  <input type="date" className="form-input" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Hora inicio *</label>
                  <input type="time" className="form-input" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Hora fin *</label>
                  <input type="time" className="form-input" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                </div>
              </div>

              {/* Sala */}
              <div>
                <label className="form-label">Sala / Ambiente</label>
                {rooms.length > 0 ? (
                  <select className="form-input" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })}>
                    <option value="">Sin sala específica</option>
                    {[...new Set([...rooms, ...(form.room ? [form.room] : [])])].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                ) : (
                  <>
                    <input className="form-input" placeholder="Sala Principal, Sala A..." value={form.room}
                      onChange={(e) => setForm({ ...form, room: e.target.value })} />
                    <p className="text-xs text-amber-600 mt-1">Configure las salas con el botón "Salas" para usar un selector.</p>
                  </>
                )}
              </div>

              <div>
                <label className="form-label">Título <span className="text-xs text-gray-400 font-normal">(para recesos / ceremonias)</span></label>
                <input className="form-input" placeholder="Almuerzo, Apertura, etc." value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>

              {/* Ponencia */}
              <div>
                <label className="form-label">
                  Ponencia <span className="text-xs text-gray-400 font-normal">(✓ aprobadas · ⚠ en revisión)</span>
                </label>
                <select className="form-input" value={form.submissionId} onChange={(e) => {
                  const subId = e.target.value;
                  if (!subId) { setForm(prev => ({ ...prev, submissionId: '' })); return; }
                  const sub = submissions.find(s => s.id === subId);
                  const corrAuthor = sub?.authors?.find(a => a.isCorresponding) ?? sub?.authors?.[0];
                  setForm(prev => ({
                    ...prev,
                    submissionId: subId,
                    thematicAxisId: sub?.thematicAxis?.id ?? sub?.thematicAxisId ?? prev.thematicAxisId,
                    speakerName: corrAuthor?.fullName ?? prev.speakerName,
                    speakerAffiliation: corrAuthor?.affiliation ?? prev.speakerAffiliation,
                  }));
                }}>
                  <option value="">Sin ponencia asociada</option>
                  {submissions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.status === 'under_review' ? '⚠ ' : '✓ '}[{s.referenceCode}] {s.titleEs.substring(0, 55)}{s.status === 'under_review' ? ' — EN REVISIÓN' : ''}
                    </option>
                  ))}
                </select>
                {selectedSubmission?.status === 'under_review' && (
                  <p className="text-xs text-pink-600 mt-1 bg-pink-50 rounded px-2 py-1">
                    ⚠ Esta ponencia aún no está aprobada. Quedará marcada en la agenda hasta su aprobación.
                  </p>
                )}
              </div>

              {event?.thematicAxes && (
                <div>
                  <label className="form-label">Eje Temático</label>
                  <select className="form-input" value={form.thematicAxisId} onChange={(e) => setForm({ ...form, thematicAxisId: e.target.value })}>
                    <option value="">Sin eje específico</option>
                    {event.thematicAxes.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="form-label">Ponente <span className="text-xs text-gray-400 font-normal">(override, para keynotes externos)</span></label>
                <input className="form-input" value={form.speakerName} onChange={(e) => setForm({ ...form, speakerName: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Institución del Ponente</label>
                <input className="form-input" value={form.speakerAffiliation} onChange={(e) => setForm({ ...form, speakerAffiliation: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Moderador/a</label>
                <input className="form-input" value={form.moderatorName} onChange={(e) => setForm({ ...form, moderatorName: e.target.value })} />
              </div>
            </div>
            <div className="p-5 pt-0 flex gap-3 justify-end border-t border-gray-100">
              <button onClick={() => { setShowForm(false); setEditingSlot(null); setForm(EMPTY_FORM); }} className="btn-outline btn-sm">Cancelar</button>
              <button onClick={handleSave} className="btn-primary btn-sm flex items-center gap-1">
                <Check size={15} /> {editingSlot ? 'Actualizar' : 'Crear Bloque'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
