import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { researchGroupsApi, universitiesApi } from '../../api/index';
import { ResearchGroup } from '../../types';
import UniversitySelect from '../../components/ui/UniversitySelect';

interface ResearchGroupForm { name: string; universityId: string; }
const EMPTY: ResearchGroupForm = { name: '', universityId: '' };

export default function ResearchGroupsAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ResearchGroup | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ResearchGroupForm>(EMPTY);
  const [universityFilter, setUniversityFilter] = useState('');

  const { data: universities } = useQuery({ queryKey: ['universities'], queryFn: () => universitiesApi.getAll() });
  const { data: groups, isLoading } = useQuery({
    queryKey: ['research-groups-admin', universityFilter],
    queryFn: () => researchGroupsApi.getAll(universityFilter ? { universityId: universityFilter } : undefined),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['research-groups-admin'] });
    qc.invalidateQueries({ queryKey: ['research-groups'] });
  };

  const createMutation = useMutation({
    mutationFn: researchGroupsApi.create,
    onSuccess: () => { toast.success('Semillero creado'); invalidate(); close(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ResearchGroup> }) => researchGroupsApi.update(id, data),
    onSuccess: () => { toast.success('Semillero actualizado'); invalidate(); close(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });
  const deleteMutation = useMutation({
    mutationFn: researchGroupsApi.remove,
    onSuccess: () => { toast.success('Semillero eliminado'); invalidate(); },
    onError: () => toast.error('Error al eliminar'),
  });

  const close = () => { setShowForm(false); setEditing(null); setForm(EMPTY); };
  const openEdit = (g: ResearchGroup) => { setEditing(g); setForm({ name: g.name, universityId: g.universityId }); setShowForm(true); };
  const handleSave = () => {
    if (!form.name || !form.universityId) return toast.error('Nombre y universidad son requeridos');
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-gray-900">Semilleros de Investigación</h1>
          <p className="text-sm text-gray-500 mt-0.5">Semilleros por universidad — usados en la postulación de estudiantes</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(EMPTY); setShowForm(true); }} className="btn-primary btn-sm flex items-center gap-1 text-white">
          <Plus size={16} /> Agregar Semillero
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="form-label mb-0">Filtrar por universidad</label>
        <UniversitySelect
          universities={universities}
          value={universityFilter}
          onChange={setUniversityFilter}
          placeholder="Todas las universidades"
          allowOther={false}
          className="max-w-xs"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-gray-400">Cargando...</div> : (
          <table className="w-full">
            <thead>
              <tr><th className="table-th">Semillero</th><th className="table-th">Universidad</th><th className="table-th">Acciones</th></tr>
            </thead>
            <tbody>
              {groups?.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="table-td font-medium">{g.name}</td>
                  <td className="table-td">{g.university?.name ?? '—'}</td>
                  <td className="table-td">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(g)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={15} /></button>
                      <button onClick={() => { if (confirm('¿Eliminar?')) deleteMutation.mutate(g.id); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {groups?.length === 0 && (
                <tr><td colSpan={3} className="table-td text-center text-gray-400 py-8">No hay semilleros registrados</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg">{editing ? 'Editar Semillero' : 'Nuevo Semillero'}</h3>
              <button onClick={close}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="form-label">Nombre *</label>
                <input className="form-input" placeholder="Semillero de Innovación..." value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Universidad *</label>
                <UniversitySelect
                  universities={universities}
                  value={form.universityId}
                  onChange={(id) => setForm({ ...form, universityId: id })}
                  allowOther={false}
                />
              </div>
            </div>
            <div className="p-5 pt-0 flex gap-3 justify-end">
              <button onClick={close} className="btn-outline btn-sm">Cancelar</button>
              <button onClick={handleSave} className="btn-primary btn-sm flex items-center gap-1"><Check size={15} /> Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
