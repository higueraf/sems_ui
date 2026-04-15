import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Plus, Edit2, Trash2, Settings,
} from 'lucide-react';
import { eventsApi } from '../../api/events.api';
import { ScientificEvent } from '../../types';
import { formatDate } from '../../utils';
import EventDetailManagement from './EventDetailManagement';

// // Componente principal
export default function EventsAdmin() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ScientificEvent | null>(null);
  const [form, setForm] = useState<Partial<ScientificEvent>>({});
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const { data: events, isLoading } = useQuery({ 
    queryKey: ['events-all'], 
    queryFn: eventsApi.getAll 
  });

  const createMutation = useMutation({
    mutationFn: eventsApi.create,
    onSuccess: () => { 
      toast.success('Evento creado'); 
      qc.invalidateQueries({ queryKey: ['events-all'] }); 
      close(); 
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ScientificEvent> }) => 
      eventsApi.update(id, data),
    onSuccess: () => { 
      toast.success('Evento actualizado'); 
      qc.invalidateQueries({ queryKey: ['events-all'] }); 
      qc.invalidateQueries({ queryKey: ['event-active'] }); 
      close(); 
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventsApi.remove(id),
    onSuccess: () => { 
      toast.success('Evento eliminado'); 
      qc.invalidateQueries({ queryKey: ['events-all'] }); 
      qc.invalidateQueries({ queryKey: ['event-active'] }); 
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const close = () => { 
    setShowForm(false); 
    setEditing(null); 
    setForm({}); 
  };

  const openEdit = (e: ScientificEvent) => { 
    setEditing(e); 
    setForm(e); 
    setShowForm(true); 
  };

  const handleSave = () => {
    if (!form.name) return toast.error('Nombre requerido');
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  const FORMAT_LABELS: Record<string, string> = { 
    in_person: 'Presencial', 
    online: 'En línea', 
    hybrid: 'Híbrido' 
  };

  // // Si hay un evento seleccionado, mostrar la gestión detallada
  if (selectedEventId) {
    return (
      <EventDetailManagement
        eventId={selectedEventId}
        onBack={() => setSelectedEventId(null)}
      />
    );
  }

  // // Vista principal de lista de eventos
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl text-gray-900">Gestión de Eventos</h1>
        <button
          onClick={() => { 
            setEditing(null); 
            setForm({ format: 'hybrid', isActive: false, category: 'symposium' }); 
            setShowForm(true); 
          }}
          className="btn-primary flex items-center gap-2 text-white"
        >
          <Plus size={16} /> Nuevo Evento
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="card text-center text-gray-400 py-8">Cargando...</div>
        ) : (events ?? []).length === 0 ? (
          <div className="card text-center text-gray-400 py-8">
            No hay eventos aún. Crea el primero con "Nuevo Evento".
          </div>
        ) : (
          (events ?? []).map((e) => (
            <div key={e.id} className={`card border-l-4 ${e.isActive ? 'border-l-primary-500' : 'border-l-gray-300'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {e.isActive && <span className="badge bg-green-100 text-green-700 text-xs">Activo</span>}
                    <span className="badge bg-gray-100 text-gray-600 text-xs">{FORMAT_LABELS[e.format] || e.format}</span>
                    {e.category === 'workshop'
                      ? <span className="badge bg-amber-100 text-amber-700 text-xs">Taller</span>
                      : <span className="badge bg-primary-100 text-primary-700 text-xs">Simposio</span>
                    }
                  </div>
                  <h3 className="font-heading font-bold text-lg text-gray-900">{e.name}</h3>
                  {e.tagline && <p className="text-gray-500 text-sm mt-1 italic">{e.tagline}</p>}
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                    {e.startDate && <span>Fecha: {formatDate(e.startDate)} {e.endDate && e.endDate !== e.startDate && `- ${formatDate(e.endDate)}`}</span>}
                    {(e.city || e.country) && <span>Lugar: {[e.city, e.country].filter(Boolean).join(', ')}</span>}
                    {e.certifiedHours && <span>Horas: {e.certifiedHours}h</span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button 
                    onClick={() => setSelectedEventId(e.id)}
                    className="btn-primary btn-sm flex items-center gap-1 text-white"
                    title="Gestionar evento"
                  >
                    <Settings size={14} />
                    Gestionar
                  </button>
                  <button 
                    onClick={() => openEdit(e)} 
                    className="btn-outline btn-sm p-2" 
                    title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => { 
                      if (confirm('¿Eliminar este evento?')) 
                        deleteMutation.mutate(e.id); 
                    }} 
                    className="btn-outline btn-sm p-2 text-red-600 hover:bg-red-50" 
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de edición/creación de evento */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg">
                {editing ? 'Editar Evento' : 'Nuevo Evento'}
              </h3>
              <button onClick={close} className="text-gray-400 hover:text-gray-600">
                <Trash2 size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="form-label">Nombre *</label>
                <input
                  className="form-input"
                  placeholder="Ej: II Simposio Internacional de Ciencia Abierta"
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Lema</label>
                <input
                  className="form-input"
                  placeholder="Lema o eslogan del evento"
                  value={form.tagline || ''}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Descripción detallada del evento"
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Edición</label>
                  <input
                    className="form-input"
                    placeholder="Ej: 2da Edición"
                    value={form.edition || ''}
                    onChange={(e) => setForm({ ...form, edition: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Formato</label>
                  <select
                    className="form-input"
                    value={form.format || ''}
                    onChange={(e) => setForm({ ...form, format: e.target.value as any })}
                  >
                    <option value="in_person">Presencial</option>
                    <option value="online">En línea</option>
                    <option value="hybrid">Híbrido</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Fecha de inicio</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.startDate || ''}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Fecha de fin</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.endDate || ''}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Ciudad</label>
                  <input
                    className="form-input"
                    placeholder="Ciudad del evento"
                    value={form.city || ''}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">País</label>
                  <input
                    className="form-input"
                    placeholder="País del evento"
                    value={form.country || ''}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Horas certificadas</label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  placeholder="Número de horas certificadas"
                  value={form.certifiedHours || ''}
                  onChange={(e) => setForm({ ...form, certifiedHours: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="form-label">URL del logo</label>
                <input
                  className="form-input"
                  placeholder="https://..."
                  value={form.logoUrl || ''}
                  onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive || false}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  <span className="text-sm">Evento activo</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isAgendaPublished || false}
                    onChange={(e) => setForm({ ...form, isAgendaPublished: e.target.checked })}
                  />
                  <span className="text-sm">Agenda publicada</span>
                </label>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={close} className="btn-outline">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn-primary"
              >
                {editing ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
