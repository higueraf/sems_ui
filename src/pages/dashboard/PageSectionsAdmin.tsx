import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Check, Eye, EyeOff } from 'lucide-react';
import { eventsApi } from '../../api/events.api';
import { pageSectionsApi } from '../../api/index';
import { EventPageSection } from '../../types';

const EMPTY = { sectionKey: '', title: '', content: '', metadata: '', displayOrder: 0, isVisible: true };

export default function PageSectionsAdmin() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EventPageSection | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const { data: event } = useQuery({ queryKey: ['event-active'], queryFn: eventsApi.getActive });
  const { data: sections, isLoading } = useQuery({
    queryKey: ['sections-admin', event?.id],
    queryFn: () => pageSectionsApi.getAll(event!.id),
    enabled: !!event?.id,
  });

  const createM = useMutation({ mutationFn: pageSectionsApi.create, onSuccess: () => { toast.success('Sección creada'); qc.invalidateQueries({ queryKey: ['sections-admin'] }); close(); }, onError: (e: any) => toast.error(e.response?.data?.message || 'Error') });
  const updateM = useMutation({ mutationFn: ({ id, data }: any) => pageSectionsApi.update(id, data), onSuccess: () => { toast.success('Actualizada'); qc.invalidateQueries({ queryKey: ['sections-admin'] }); close(); } });
  const deleteM = useMutation({ mutationFn: pageSectionsApi.remove, onSuccess: () => { toast.success('Eliminada'); qc.invalidateQueries({ queryKey: ['sections-admin'] }); } });

  const close = () => { setShowForm(false); setEditing(null); setForm(EMPTY); };
  const openEdit = (s: EventPageSection) => {
    setEditing(s);
    setForm({ ...s, metadata: JSON.stringify(s.metadata, null, 2) });
    setShowForm(true);
  };
  const handleSave = () => {
    if (!form.sectionKey) return toast.error('Clave de sección requerida');
    let metadata: any = undefined;
    if (form.metadata) {
      try { metadata = JSON.parse(form.metadata); } catch { return toast.error('El campo metadata no es JSON válido'); }
    }
    const payload = { ...form, metadata, eventId: event!.id };
    if (editing) updateM.mutate({ id: editing.id, data: payload });
    else createM.mutate(payload);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl text-gray-900">Contenido del Sitio Web</h1>
        <button onClick={() => { setEditing(null); setForm(EMPTY); setShowForm(true); }} className="btn-primary btn-sm flex items-center gap-1"><Plus size={16} /> Nueva Sección</button>
      </div>
      <p className="text-sm text-gray-500">Gestione el contenido dinámico de las secciones del sitio público.</p>
      <div className="space-y-3">
        {isLoading ? <div className="card text-center text-gray-400 py-8">Cargando...</div> : sections?.map((s) => (
          <div key={s.id} className="card !py-4 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <code className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s.sectionKey}</code>
                {!s.isVisible ? <span className="badge bg-gray-100 text-gray-500 text-xs flex items-center gap-1"><EyeOff size={10} /> Oculto</span> : <span className="badge bg-green-100 text-green-700 text-xs flex items-center gap-1"><Eye size={10} /> Visible</span>}
                <span className="text-xs text-gray-400">Orden: {s.displayOrder}</span>
              </div>
              <h3 className="font-semibold text-gray-900">{s.title || <span className="text-gray-400 italic">Sin título</span>}</h3>
              {s.content && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{s.content}</p>}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => openEdit(s)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={15} /></button>
              <button onClick={() => { if (confirm('¿Eliminar?')) deleteM.mutate(s.id); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg">{editing ? 'Editar Sección' : 'Nueva Sección'}</h3>
              <button onClick={close}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto max-h-[65vh]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Clave de Sección * <span className="text-gray-400 font-normal">(identificador único)</span></label>
                  <input className="form-input font-mono" placeholder="hero, about, dates..." value={form.sectionKey} onChange={(e) => setForm({ ...form, sectionKey: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Orden de Visualización</label>
                  <input type="number" className="form-input" value={form.displayOrder || 0} onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="form-label">Título</label>
                <input className="form-input" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Contenido (texto principal)</label>
                <textarea rows={5} className="form-input resize-y" value={form.content || ''} onChange={(e) => setForm({ ...form, content: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Metadata (JSON) <span className="text-gray-400 font-normal">– datos estructurados adicionales</span></label>
                <textarea rows={8} className="form-input resize-y font-mono text-xs" value={form.metadata || ''} onChange={(e) => setForm({ ...form, metadata: e.target.value })} placeholder='{"key": "value"}' />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isVisible} onChange={(e) => setForm({ ...form, isVisible: e.target.checked })} className="w-4 h-4 accent-primary-500" />
                Visible en sitio público
              </label>
            </div>
            <div className="p-5 pt-0 flex gap-3 justify-end border-t">
              <button onClick={close} className="btn-outline btn-sm">Cancelar</button>
              <button onClick={handleSave} className="btn-primary btn-sm flex items-center gap-1"><Check size={15} /> Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
