import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { countriesApi } from '../../api/index';
import { Country } from '../../types';

interface CountryForm { name: string; isoCode: string; flagEmoji: string; flagIconUrl: string; }
const EMPTY: CountryForm = { name: '', isoCode: '', flagEmoji: '', flagIconUrl: '' };

export default function CountriesAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Country | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CountryForm>(EMPTY);

  const { data: countries, isLoading } = useQuery({ queryKey: ['countries-admin'], queryFn: () => countriesApi.getAll() });

  const createMutation = useMutation({
    mutationFn: countriesApi.create,
    onSuccess: () => { toast.success('País creado'); qc.invalidateQueries({ queryKey: ['countries-admin'] }); qc.invalidateQueries({ queryKey: ['countries'] }); close(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Country> }) => countriesApi.update(id, data),
    onSuccess: () => { toast.success('País actualizado'); qc.invalidateQueries({ queryKey: ['countries-admin'] }); qc.invalidateQueries({ queryKey: ['countries'] }); close(); },
  });
  const deleteMutation = useMutation({
    mutationFn: countriesApi.remove,
    onSuccess: () => { toast.success('País eliminado'); qc.invalidateQueries({ queryKey: ['countries-admin'] }); qc.invalidateQueries({ queryKey: ['countries'] }); },
    onError: () => toast.error('Error al eliminar'),
  });

  const close = () => { setShowForm(false); setEditing(null); setForm(EMPTY); };
  const openEdit = (c: Country) => { setEditing(c); setForm({ name: c.name, isoCode: c.isoCode, flagEmoji: c.flagEmoji || '', flagIconUrl: c.flagIconUrl || '' }); setShowForm(true); };
  const handleSave = () => {
    if (!form.name || !form.isoCode) return toast.error('Nombre y código ISO son requeridos');
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl text-gray-900">Países</h1>
        <button onClick={() => { setEditing(null); setForm(EMPTY); setShowForm(true); }} className="btn-primary btn-sm flex items-center gap-1">
          <Plus size={16} /> Agregar País
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-gray-400">Cargando...</div> : (
          <table className="w-full">
            <thead>
              <tr><th className="table-th">Bandera</th><th className="table-th">Nombre</th><th className="table-th">ISO</th><th className="table-th">Acciones</th></tr>
            </thead>
            <tbody>
              {countries?.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="table-td text-2xl">{c.flagEmoji || '🏳️'}</td>
                  <td className="table-td font-medium">{c.name}</td>
                  <td className="table-td"><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{c.isoCode}</span></td>
                  <td className="table-td">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={15} /></button>
                      <button onClick={() => { if (confirm('¿Eliminar?')) deleteMutation.mutate(c.id); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg">{editing ? 'Editar País' : 'Nuevo País'}</h3>
              <button onClick={close}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { field: 'name', label: 'Nombre *', placeholder: 'Colombia' },
                { field: 'isoCode', label: 'Código ISO * (2 letras)', placeholder: 'CO' },
                { field: 'flagEmoji', label: 'Emoji de Bandera', placeholder: '🇨🇴' },
                { field: 'flagIconUrl', label: 'URL del icono de bandera', placeholder: 'https://...' },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="form-label">{label}</label>
                  <input className="form-input" placeholder={placeholder} value={(form as any)[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })} maxLength={field === 'isoCode' ? 2 : undefined} />
                </div>
              ))}
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
