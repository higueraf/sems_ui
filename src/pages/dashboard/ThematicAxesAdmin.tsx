import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { eventsApi } from '../../api/events.api';
import { thematicAxesApi } from '../../api/index';
import { ThematicAxis } from '../../types';

const EMPTY = { name: '', description: '', color: '#007F3A', icon: '', displayOrder: 0, isActive: true };

export default function ThematicAxesAdmin() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ThematicAxis | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const { data: event } = useQuery({ queryKey: ['event-active'], queryFn: eventsApi.getActive });
  const { data: axes, isLoading } = useQuery({
    queryKey: ['axes-admin', event?.id],
    queryFn: () => thematicAxesApi.getAll(event!.id),
    enabled: !!event?.id,
  });

  const createM = useMutation({ mutationFn: thematicAxesApi.create, onSuccess: () => { toast.success('Eje creado'); qc.invalidateQueries({ queryKey: ['axes-admin'] }); close(); }, onError: (e: any) => toast.error(e.response?.data?.message || 'Error') });
  const updateM = useMutation({ mutationFn: ({ id, data }: any) => thematicAxesApi.update(id, data), onSuccess: () => { toast.success('Actualizado'); qc.invalidateQueries({ queryKey: ['axes-admin'] }); close(); } });
  const deleteM = useMutation({ mutationFn: thematicAxesApi.remove, onSuccess: () => { toast.success('Eliminado'); qc.invalidateQueries({ queryKey: ['axes-admin'] }); } });

  const close = () => { setShowForm(false); setEditing(null); setForm(EMPTY); };
  const openEdit = (a: ThematicAxis) => { setEditing(a); setForm(a); setShowForm(true); };
  const handleSave = () => {
    if (!form.name) return toast.error('Nombre requerido');
    const payload = { ...form, eventId: event!.id };
    if (editing) updateM.mutate({ id: editing.id, data: payload });
    else createM.mutate(payload);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl text-gray-900">Ejes Temáticos</h1>
        <button onClick={() => { setEditing(null); setForm(EMPTY); setShowForm(true); }} className="btn-primary btn-sm flex items-center gap-1"><Plus size={16} /> Nuevo Eje</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? <div className="card text-center text-gray-400 py-8 col-span-2">Cargando...</div> : axes?.map((a) => (
          <div key={a.id} className="card flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold" style={{ backgroundColor: a.color || '#007F3A' }}>
              {a.displayOrder}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900">{a.name}</h3>
              {a.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{a.description}</p>}
              {!a.isActive && <span className="badge bg-gray-100 text-gray-500 text-xs mt-1">Inactivo</span>}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => openEdit(a)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={15} /></button>
              <button onClick={() => { if (confirm('¿Eliminar?')) deleteM.mutate(a.id); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg">{editing ? 'Editar Eje' : 'Nuevo Eje Temático'}</h3>
              <button onClick={close}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="form-label">Nombre *</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Descripción</label>
                <textarea rows={3} className="form-input resize-none" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={form.color || '#007F3A'} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer" />
                    <input className="form-input flex-1" value={form.color || '#007F3A'} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Orden</label>
                  <input type="number" className="form-input" value={form.displayOrder || 0} onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="form-label">Ícono (Lucide Icon)</label>
                <input className="form-input" placeholder="BookOpen, Cpu, GraduationCap..." value={form.icon || ''} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-primary-500" />
                Activo
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
