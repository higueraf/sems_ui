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
  Plus, GripVertical, Trash2, Edit2, Check, Eye, EyeOff, Send,
} from 'lucide-react';
import { eventsApi } from '../../api/events.api';
import { agendaApi } from '../../api/agenda.api';
import { submissionsApi } from '../../api/submissions.api';
import { AgendaSlot } from '../../types';
import { SLOT_TYPE_LABELS, formatTime } from '../../utils';

function SortableSlot({
  slot, onEdit, onDelete, onTogglePublish,
}: {
  slot: AgendaSlot;
  onEdit: (slot: AgendaSlot) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (slot: AgendaSlot) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slot.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const SLOT_COLORS: Record<string, string> = {
    keynote: 'border-accent-400',
    presentation: 'border-primary-400',
    break: 'border-gray-300',
    ceremony: 'border-yellow-400',
    workshop: 'border-blue-400',
    panel: 'border-purple-400',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border-l-4 ${SLOT_COLORS[slot.type] || 'border-gray-300'} rounded-r-lg shadow-sm p-3 flex items-center gap-3 group`}
    >
      <div {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500 p-1">
        <GripVertical size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-gray-400">{formatTime(slot.startTime)}–{formatTime(slot.endTime)}</span>
          {slot.room && <span className="text-xs text-gray-400">| {slot.room}</span>}
          <span className="badge bg-gray-100 text-gray-600 text-xs">{SLOT_TYPE_LABELS[slot.type] || slot.type}</span>
          {slot.isPublished && <span className="badge bg-green-100 text-green-700 text-xs">Publicado</span>}
        </div>
        <p className="text-sm font-medium text-gray-800 mt-0.5 truncate">
          {slot.submission?.titleEs || slot.title || '—'}
        </p>
        {(slot.speakerName || slot.submission?.authors?.[0]?.fullName) && (
          <p className="text-xs text-gray-400 mt-0.5">
            {slot.speakerName || slot.submission?.authors?.find((a) => a.isCorresponding)?.fullName}
            {slot.submission?.authors?.find((a) => a.isCorresponding)?.country?.flagEmoji && (
              <span className="ml-1">{slot.submission?.authors?.find((a) => a.isCorresponding)?.country?.flagEmoji}</span>
            )}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onTogglePublish(slot)} title={slot.isPublished ? 'Quitar publicación' : 'Publicar'} className="p-1.5 text-gray-400 hover:text-primary-600 rounded">
          {slot.isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
        <button onClick={() => onEdit(slot)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
          <Edit2 size={15} />
        </button>
        <button onClick={() => onDelete(slot.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

interface SlotForm {
  type: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  title: string;
  submissionId: string;
  thematicAxisId: string;
  speakerName: string;
  speakerAffiliation: string;
  moderatorName: string;
  description: string;
}

const EMPTY_FORM: SlotForm = {
  type: 'presentation', day: '', startTime: '', endTime: '',
  room: '', title: '', submissionId: '', thematicAxisId: '',
  speakerName: '', speakerAffiliation: '', moderatorName: '', description: '',
};

export default function AgendaBuilder() {
  const qc = useQueryClient();
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AgendaSlot | null>(null);
  const [form, setForm] = useState<SlotForm>(EMPTY_FORM);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { data: event } = useQuery({ queryKey: ['event-active'], queryFn: eventsApi.getActive });
  const { data: slots = [] } = useQuery({
    queryKey: ['agenda-all', event?.id],
    queryFn: () => agendaApi.getAll(event!.id),
    enabled: !!event?.id,
  });
  const { data: submissions } = useQuery({
    queryKey: ['submissions-approved', event?.id],
    queryFn: () => submissionsApi.getAll({ eventId: event?.id, status: 'approved' }),
    enabled: !!event?.id,
  });

  const days = useMemo(() => {
    const unique = [...new Set(slots.map((s) => s.day.split('T')[0]))].sort();
    return unique;
  }, [slots]);

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = slotsForDay.findIndex((s) => s.id === active.id);
    const newIndex = slotsForDay.findIndex((s) => s.id === over.id);
    const newOrder = arrayMove(slotsForDay, oldIndex, newIndex);
    reorderMutation.mutate(newOrder.map((s) => s.id));
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
    const payload = {
      ...form, eventId: event!.id,
      submissionId: form.submissionId || undefined,
      thematicAxisId: form.thematicAxisId || undefined,
    } as any;
    if (editingSlot) {
      updateMutation.mutate({ id: editingSlot.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-heading font-bold text-2xl text-gray-900">Agenda del Evento</h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setEditingSlot(null); setForm({ ...EMPTY_FORM, day: selectedDay }); setShowForm(true); }}
            className="btn-primary btn-sm flex items-center gap-1"
          >
            <Plus size={16} /> Agregar Bloque
          </button>
          <button onClick={() => publishAllMutation.mutate()} className="btn-outline btn-sm flex items-center gap-1">
            <Send size={15} /> Publicar Todo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Day Selector */}
        <div className="card !p-4 space-y-2 lg:col-span-1">
          <h3 className="font-heading font-semibold text-gray-700 text-sm mb-3">Días del Evento</h3>
          {event?.startDate && event?.endDate && (
            <div className="mb-3">
              {/* Auto-populate days from event date range */}
              {Array.from({ length: 5 }, (_, i) => {
                const d = new Date(event.startDate);
                d.setDate(d.getDate() + i);
                const dayStr = d.toISOString().split('T')[0];
                return dayStr;
              }).map((day) => {
                const date = parseISO(day);
                const hasSlots = days.includes(day);
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm mb-1 transition-all ${
                      isSelected ? 'bg-primary-500 text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{format(date, 'EEE dd MMM', { locale: es })}</div>
                    {hasSlots && (
                      <div className={`text-xs ${isSelected ? 'text-primary-100' : 'text-gray-400'}`}>
                        {slotsForDay.filter((s) => s.day.split('T')[0] === day).length} bloques
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {days.filter((d) => !Array.from({ length: 5 }, (_, i) => {
            const date = new Date(event?.startDate || '');
            date.setDate(date.getDate() + i);
            return date.toISOString().split('T')[0];
          }).includes(d)).map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-all ${
                selectedDay === day ? 'bg-primary-500 text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {format(parseISO(day), 'EEE dd MMM', { locale: es })}
            </button>
          ))}
        </div>

        {/* Slots */}
        <div className="lg:col-span-3 space-y-3">
          {!selectedDay ? (
            <div className="card text-center py-12 text-gray-400">
              Seleccione un día para gestionar los bloques de la agenda
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-semibold text-gray-800">
                  {format(parseISO(selectedDay), "EEEE, dd 'de' MMMM", { locale: es })}
                </h3>
                <span className="text-sm text-gray-400">{slotsForDay.length} bloques</span>
              </div>

              {slotsForDay.length === 0 ? (
                <div className="card text-center py-10 text-gray-400">
                  No hay bloques para este día. Haga clic en "Agregar Bloque".
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={slotsForDay.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {slotsForDay.map((slot) => (
                        <SortableSlot
                          key={slot.id}
                          slot={slot}
                          onEdit={openEdit}
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

      {/* Slot Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl my-4">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-heading font-bold text-lg">
                {editingSlot ? 'Editar Bloque' : 'Nuevo Bloque de Agenda'}
              </h3>
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
              <div>
                <label className="form-label">Sala / Room</label>
                <input className="form-input" placeholder="Sala Principal, Sala A..." value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Título (si es receso/ceremonia)</label>
                <input className="form-input" placeholder="Almuerzo, Apertura, etc." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Ponencia Aprobada</label>
                <select className="form-input" value={form.submissionId} onChange={(e) => setForm({ ...form, submissionId: e.target.value })}>
                  <option value="">Sin ponencia asociada</option>
                  {submissions?.map((s) => (
                    <option key={s.id} value={s.id}>[{s.referenceCode}] {s.titleEs.substring(0, 60)}...</option>
                  ))}
                </select>
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
                <label className="form-label">Nombre del Ponente</label>
                <input className="form-input" value={form.speakerName} onChange={(e) => setForm({ ...form, speakerName: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Afiliación del Ponente</label>
                <input className="form-input" value={form.speakerAffiliation} onChange={(e) => setForm({ ...form, speakerAffiliation: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Moderador</label>
                <input className="form-input" value={form.moderatorName} onChange={(e) => setForm({ ...form, moderatorName: e.target.value })} />
              </div>
            </div>
            <div className="p-5 pt-0 flex gap-3 justify-end border-t border-gray-100">
              <button onClick={() => { setShowForm(false); setEditingSlot(null); setForm(EMPTY_FORM); }} className="btn-outline btn-sm">
                Cancelar
              </button>
              <button onClick={handleSave} className="btn-primary btn-sm flex items-center gap-1">
                <Check size={15} />
                {editingSlot ? 'Actualizar' : 'Crear Bloque'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
