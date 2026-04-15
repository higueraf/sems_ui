import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { productTypesApi } from '../../api/index';
import { ScientificProductType } from '../../types';

const EMPTY = { name: '', description: '', maxAuthors: 4, minPages: 1, maxPages: 10, maxPresentationMinutes: 15, requiresFile: true, formatGuidelinesHtml: '', isActive: true };

export default function ProductTypesAdmin() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ScientificProductType | null>(null);
  const [form, setForm] = useState<any>(EMPTY);

  const { data: types, isLoading } = useQuery({ queryKey: ['product-types-all'], queryFn: () => productTypesApi.getAll() });
  const createM = useMutation({ mutationFn: productTypesApi.create, onSuccess: () => { toast.success('Creado'); qc.invalidateQueries({ queryKey: ['product-types-all'] }); close(); }, onError: (e: any) => toast.error(e.response?.data?.message || 'Error') });
  const updateM = useMutation({ mutationFn: ({ id, data }: any) => productTypesApi.update(id, data), onSuccess: () => { toast.success('Actualizado'); qc.invalidateQueries({ queryKey: ['product-types-all'] }); close(); } });
  const deleteM = useMutation({ mutationFn: productTypesApi.remove, onSuccess: () => { toast.success('Eliminado'); qc.invalidateQueries({ queryKey: ['product-types-all'] }); } });

  const close = () => { setShowForm(false); setEditing(null); setForm(EMPTY); };
  const openEdit = (t: ScientificProductType) => { setEditing(t); setForm(t); setShowForm(true); };
  const handleSave = () => {
    if (!form.name) return toast.error('Nombre requerido');
    if (editing) updateM.mutate({ id: editing.id, data: form });
    else createM.mutate(form);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl text-gray-900">Tipos de Producto Científico</h1>
        <button onClick={() => { setEditing(null); setForm(EMPTY); setShowForm(true); }} className="btn-primary btn-sm flex items-center gap-1 text-white"><Plus size={16} /> Nuevo Tipo</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-gray-400">Cargando...</div> : (
          <table className="w-full">
            <thead><tr><th className="table-th">Nombre</th><th className="table-th">Max Autores</th><th className="table-th">Páginas</th><th className="table-th">Min. presentación</th><th className="table-th">Estado</th><th className="table-th">Acciones</th></tr></thead>
            <tbody>
              {types?.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="table-td font-medium">
                    <div>{t.name}</div>
                    {t.description && <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{t.description}</div>}
                  </td>
                  <td className="table-td text-center">{t.maxAuthors || '—'}</td>
                  <td className="table-td text-sm text-gray-500">{t.minPages || 0}–{t.maxPages || '—'}</td>
                  <td className="table-td text-sm text-gray-500">{t.maxPresentationMinutes ? `${t.maxPresentationMinutes} min` : '—'}</td>
                  <td className="table-td"><span className={`badge ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{t.isActive ? 'Activo' : 'Inactivo'}</span></td>
                  <td className="table-td">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(t)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={15} /></button>
                      <button onClick={() => { if (confirm('¿Eliminar?')) deleteM.mutate(t.id); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg">{editing ? 'Editar Tipo' : 'Nuevo Tipo de Producto'}</h3>
              <button onClick={close}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto max-h-[65vh]">
              <div>
                <label className="form-label">Nombre *</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Descripción</label>
                <textarea rows={2} className="form-input resize-none" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { f: 'maxAuthors', l: 'Máx. Autores' }, { f: 'minPages', l: 'Mín. Páginas' },
                  { f: 'maxPages', l: 'Máx. Páginas' }, { f: 'maxPresentationMinutes', l: 'Minutos presentación' },
                ].map(({ f, l }) => (
                  <div key={f}>
                    <label className="form-label">{l}</label>
                    <input type="number" className="form-input" value={form[f] || ''} onChange={(e) => setForm({ ...form, [f]: parseInt(e.target.value) })} />
                  </div>
                ))}
              </div>
              <div>
                <label className="form-label">Pautas de Formato (HTML)</label>
                <textarea rows={4} className="form-input resize-y" value={form.formatGuidelinesHtml || ''} onChange={(e) => setForm({ ...form, formatGuidelinesHtml: e.target.value })} />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.requiresFile} onChange={(e) => setForm({ ...form, requiresFile: e.target.checked })} className="w-4 h-4 accent-primary-500" />
                  Requiere archivo
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-primary-500" />
                  Activo
                </label>
              </div>
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
