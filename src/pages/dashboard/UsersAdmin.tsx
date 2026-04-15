import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Check, Shield } from 'lucide-react';
import { usersApi } from '../../api/index';
import { User } from '../../types';
import { formatDate } from '../../utils';

interface UserForm { email: string; password: string; firstName: string; lastName: string; role: string; isActive: boolean; }
const EMPTY: UserForm = { email: '', password: '', firstName: '', lastName: '', role: 'evaluator', isActive: true };

export default function UsersAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<UserForm>(EMPTY);

  const { data: users, isLoading } = useQuery({ queryKey: ['users-admin'], queryFn: usersApi.getAll });

  const createMutation = useMutation({
    mutationFn: (data: any) => usersApi.create(data),
    onSuccess: () => { toast.success('Usuario creado'); qc.invalidateQueries({ queryKey: ['users-admin'] }); close(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => usersApi.update(id, data),
    onSuccess: () => { toast.success('Usuario actualizado'); qc.invalidateQueries({ queryKey: ['users-admin'] }); close(); },
  });
  const deleteMutation = useMutation({
    mutationFn: usersApi.remove,
    onSuccess: () => { toast.success('Usuario eliminado'); qc.invalidateQueries({ queryKey: ['users-admin'] }); },
  });

  const close = () => { setShowForm(false); setEditing(null); setForm(EMPTY); };
  const openEdit = (u: User) => { setEditing(u); setForm({ email: u.email, password: '', firstName: u.firstName, lastName: u.lastName, role: u.role, isActive: true }); setShowForm(true); };
  const handleSave = () => {
    if (!form.email || !form.firstName || !form.lastName) return toast.error('Campos requeridos incompletos');
    const data: any = { email: form.email, firstName: form.firstName, lastName: form.lastName, role: form.role, isActive: form.isActive };
    if (!editing && !form.password) return toast.error('Contraseña requerida para nuevos usuarios');
    if (form.password) data.password = form.password;
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  const ROLE_BADGES: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    evaluator: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl text-gray-900">Usuarios del Sistema</h1>
        <button onClick={() => { setEditing(null); setForm(EMPTY); setShowForm(true); }} className="btn-primary btn-sm flex items-center gap-1 text-white">
          <Plus size={16} /> Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-gray-400">Cargando...</div> : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Usuario</th><th className="table-th">Email</th>
                <th className="table-th">Rol</th><th className="table-th">Estado</th>
                <th className="table-th">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-semibold text-sm">{u.firstName[0]}{u.lastName[0]}</span>
                      </div>
                      <span className="font-medium text-gray-900">{u.firstName} {u.lastName}</span>
                    </div>
                  </td>
                  <td className="table-td text-gray-500">{u.email}</td>
                  <td className="table-td">
                    <span className={`badge ${ROLE_BADGES[u.role] || 'bg-gray-100 text-gray-600'} flex items-center gap-1 w-fit`}>
                      <Shield size={12} /> {u.role}
                    </span>
                  </td>
                  <td className="table-td">
                    <span className="badge bg-green-100 text-green-700">Activo</span>
                  </td>
                  <td className="table-td">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={15} /></button>
                      <button onClick={() => { if (confirm('¿Eliminar usuario?')) deleteMutation.mutate(u.id); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={15} /></button>
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
              <h3 className="font-heading font-bold text-lg">{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button onClick={close}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Nombre *</label>
                  <input className="form-input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Apellido *</label>
                  <input className="form-input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="form-label">Email *</label>
                <input type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="form-label">{editing ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
                <input type="password" className="form-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 8 caracteres" />
              </div>
              <div>
                <label className="form-label">Rol *</label>
                <select className="form-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="evaluator">Evaluador</option>
                  <option value="admin">Administrador</option>
                </select>
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
