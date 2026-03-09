import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Check, Eye, EyeOff } from 'lucide-react';
import { eventsApi } from '../../api/events.api';
import { ScientificEvent } from '../../types';
import { formatDate } from '../../utils';

export default function EventsAdmin() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ScientificEvent | null>(null);
  const [form, setForm] = useState<Partial<ScientificEvent>>({});

  const { data: events, isLoading } = useQuery({ queryKey: ['events-all'], queryFn: eventsApi.getAll });

  const createMutation = useMutation({
    mutationFn: eventsApi.create,
    onSuccess: () => { toast.success('Evento creado'); qc.invalidateQueries({ queryKey: ['events-all'] }); close(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ScientificEvent> }) => eventsApi.update(id, data),
    onSuccess: () => { toast.success('Evento actualizado'); qc.invalidateQueries({ queryKey: ['events-all'] }); qc.invalidateQueries({ queryKey: ['event-active'] }); close(); },
  });
  const deleteMutation = useMutation({
    mutationFn: eventsApi.remove,
    onSuccess: () => { toast.success('Evento eliminado'); qc.invalidateQueries({ queryKey: ['events-all'] }); },
  });

  const close = () => { setShowForm(false); setEditing(null); setForm({}); };
  const openEdit = (e: ScientificEvent) => { setEditing(e); setForm(e); setShowForm(true); };
  const handleSave = () => {
    if (!form.name) return toast.error('Nombre requerido');
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  const FORMAT_LABELS: Record<string, string> = { in_person: 'Presencial', online: 'En línea', hybrid: 'Híbrido' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl text-gray-900">Gestión de Eventos</h1>
        <button onClick={() => { setEditing(null); setForm({ format: 'hybrid', isActive: false }); setShowForm(true); }} className="btn-primary btn-sm flex items-center gap-1">
          <Plus size={16} /> Nuevo Evento
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? <div className="card text-center text-gray-400 py-8">Cargando...</div> : events?.map((e) => (
          <div key={e.id} className={`card border-l-4 ${e.isActive ? 'border-l-primary-500' : 'border-l-gray-300'}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {e.isActive && <span className="badge bg-green-100 text-green-700 text-xs">Activo</span>}
                  <span className="badge bg-gray-100 text-gray-600 text-xs">{FORMAT_LABELS[e.format] || e.format}</span>
                </div>
                <h3 className="font-heading font-bold text-lg text-gray-900">{e.name}</h3>
                {e.tagline && <p className="text-gray-500 text-sm mt-1 italic">{e.tagline}</p>}
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                  {e.startDate && <span>📅 {formatDate(e.startDate)} – {formatDate(e.endDate)}</span>}
                  {e.city && <span>📍 {e.city}, {e.country}</span>}
                  {e.certifiedHours && <span>🎓 {e.certifiedHours}h</span>}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(e)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                <button onClick={() => { if (confirm('¿Eliminar?')) deleteMutation.mutate(e.id); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg">{editing ? 'Editar Evento' : 'Nuevo Evento'}</h3>
              <button onClick={close}><X size={20} /></button>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[70vh]">
              <div className="md:col-span-2">
                <label className="form-label">Nombre del Evento *</label>
                <input className="form-input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Edición</label>
                <input className="form-input" placeholder="II" value={form.edition || ''} onChange={(e) => setForm({ ...form, edition: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Formato</label>
                <select className="form-input" value={form.format || 'hybrid'} onChange={(e) => setForm({ ...form, format: e.target.value as any })}>
                  <option value="in_person">Presencial</option>
                  <option value="online">En línea</option>
                  <option value="hybrid">Híbrido</option>
                </select>
              </div>
              <div>
                <label className="form-label">Fecha Inicio</label>
                <input type="date" className="form-input" value={form.startDate?.split('T')[0] || ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Fecha Fin</label>
                <input type="date" className="form-input" value={form.endDate?.split('T')[0] || ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Ciudad</label>
                <input className="form-input" value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <label className="form-label">País</label>
                <input className="form-input" value={form.country || ''} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Lugar / Institución</label>
                <input className="form-input" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Horas Certificadas</label>
                <input type="number" className="form-input" value={form.certifiedHours || ''} onChange={(e) => setForm({ ...form, certifiedHours: parseInt(e.target.value) })} />
              </div>
              <div>
                <label className="form-label">Fecha límite envío</label>
                <input type="date" className="form-input" value={form.submissionDeadline?.split('T')[0] || ''} onChange={(e) => setForm({ ...form, submissionDeadline: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Email Contacto</label>
                <input type="email" className="form-input" value={form.contactEmail || ''} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Tagline</label>
                <input className="form-input" value={form.tagline || ''} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Descripción</label>
                <textarea rows={4} className="form-input resize-none" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="md:col-span-2 flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isActive || false} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-primary-500" />
                  Evento Activo (visible en el sitio)
                </label>
              </div>
            </div>
            <div className="p-5 pt-0 flex gap-3 justify-end border-t border-gray-100 mt-2">
              <button onClick={close} className="btn-outline btn-sm">Cancelar</button>
              <button onClick={handleSave} className="btn-primary btn-sm flex items-center gap-1"><Check size={15} /> Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
