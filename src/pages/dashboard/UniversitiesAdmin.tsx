import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Check, Upload, Image, MapPin } from 'lucide-react';
import { universitiesApi, countriesApi } from '../../api/index';
import { University } from '../../types';
import { getFileUrl } from '../../utils';
import CountrySelect from '../../components/ui/CountrySelect';

interface UniversityForm {
  name: string; countryId: string; phone: string; email: string;
  address: string; latitude: string; longitude: string; isHostInstitution: boolean;
}
const EMPTY: UniversityForm = {
  name: '', countryId: '', phone: '', email: '', address: '', latitude: '', longitude: '', isHostInstitution: false,
};

export default function UniversitiesAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<University | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<UniversityForm>(EMPTY);
  const [countryFilter, setCountryFilter] = useState('');
  const [uploadingLogoId, setUploadingLogoId] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['universities-admin'] });
    qc.invalidateQueries({ queryKey: ['universities'] });
  };

  const { data: countries } = useQuery({ queryKey: ['countries'], queryFn: () => countriesApi.getAll() });
  const { data: universities, isLoading } = useQuery({
    queryKey: ['universities-admin', countryFilter],
    queryFn: () => universitiesApi.getAll(countryFilter ? { countryId: countryFilter } : undefined),
  });

  const createMutation = useMutation({
    mutationFn: universitiesApi.create,
    onSuccess: () => { toast.success('Universidad creada'); invalidate(); close(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<University> }) => universitiesApi.update(id, data),
    onSuccess: () => { toast.success('Universidad actualizada'); invalidate(); close(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });
  const deleteMutation = useMutation({
    mutationFn: universitiesApi.remove,
    onSuccess: () => { toast.success('Universidad eliminada'); invalidate(); },
    onError: () => toast.error('Error al eliminar'),
  });

  const close = () => { setShowForm(false); setEditing(null); setForm(EMPTY); };
  const openEdit = (u: University) => {
    setEditing(u);
    setForm({
      name: u.name,
      countryId: u.countryId,
      phone: u.phone ?? '',
      email: u.email ?? '',
      address: u.address ?? '',
      latitude: u.latitude != null ? String(u.latitude) : '',
      longitude: u.longitude != null ? String(u.longitude) : '',
      isHostInstitution: u.isHostInstitution ?? false,
    });
    setShowForm(true);
  };
  const handleSave = () => {
    if (!form.name || !form.countryId) return toast.error('Nombre y país son requeridos');
    const data: Partial<University> = {
      name: form.name,
      countryId: form.countryId,
      phone: form.phone || undefined,
      email: form.email || undefined,
      address: form.address || undefined,
      latitude: form.latitude ? Number(form.latitude) : undefined,
      longitude: form.longitude ? Number(form.longitude) : undefined,
      isHostInstitution: form.isHostInstitution,
    };
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  const handleLogoUpload = async (university: University, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogoId(university.id);
    try {
      await universitiesApi.uploadLogo(university.id, file);
      invalidate();
      toast.success('Logo actualizado');
    } catch {
      toast.error('Error al subir logo');
    } finally {
      setUploadingLogoId(null);
      if (logoRef.current) logoRef.current.value = '';
    }
  };

  const mapsUrl = (u: University) =>
    u.latitude != null && u.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${u.latitude},${u.longitude}`
      : u.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${u.name} ${u.address}`)}`
        : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl text-gray-900">Universidades</h1>
        <button onClick={() => { setEditing(null); setForm(EMPTY); setShowForm(true); }} className="btn-primary btn-sm flex items-center gap-1 text-white">
          <Plus size={16} /> Agregar Universidad
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="form-label mb-0">Filtrar por país</label>
        <CountrySelect
          countries={countries}
          value={countryFilter}
          onChange={setCountryFilter}
          placeholder="Todos los países"
          className="max-w-xs"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-gray-400">Cargando...</div> : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Logo</th><th className="table-th">Universidad</th>
                <th className="table-th">País</th><th className="table-th">Contacto</th>
                <th className="table-th">Ubicación</th><th className="table-th">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {universities?.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="table-td">
                    <div className="relative w-10 h-10 flex-shrink-0">
                      {u.logoUrl ? (
                        <img
                          src={getFileUrl(u.logoUrl)}
                          alt={u.name}
                          className="w-10 h-10 object-contain rounded border border-gray-100 bg-gray-50 p-1"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                          <Image size={14} className="text-gray-300" />
                        </div>
                      )}
                      <label
                        htmlFor={`uni-logo-${u.id}`}
                        className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow"
                        title="Subir logo"
                      >
                        {uploadingLogoId === u.id
                          ? <span className="w-2 h-2 border border-white rounded-full animate-spin border-t-transparent" />
                          : <Upload size={8} className="text-white" />}
                      </label>
                      <input
                        id={`uni-logo-${u.id}`}
                        type="file" accept="image/*" className="hidden"
                        onChange={(e) => handleLogoUpload(u, e)}
                        disabled={uploadingLogoId === u.id}
                      />
                    </div>
                  </td>
                  <td className="table-td font-medium">
                    {u.name}
                    {u.isHostInstitution && (
                      <span className="ml-2 badge bg-primary-100 text-primary-700 text-[10px] align-middle">Sede</span>
                    )}
                  </td>
                  <td className="table-td">{u.country ? `${u.country.flagEmoji} ${u.country.name}` : '—'}</td>
                  <td className="table-td text-xs text-gray-500">
                    {u.phone && <p>{u.phone}</p>}
                    {u.email && <p>{u.email}</p>}
                    {!u.phone && !u.email && '—'}
                  </td>
                  <td className="table-td text-xs">
                    {mapsUrl(u) ? (
                      <a href={mapsUrl(u)!} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline flex items-center gap-1">
                        <MapPin size={12} /> Ver en Maps
                      </a>
                    ) : '—'}
                  </td>
                  <td className="table-td">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={15} /></button>
                      <button onClick={() => { if (confirm('¿Eliminar?')) deleteMutation.mutate(u.id); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {universities?.length === 0 && (
                <tr><td colSpan={6} className="table-td text-center text-gray-400 py-8">No hay universidades registradas</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg">{editing ? 'Editar Universidad' : 'Nueva Universidad'}</h3>
              <button onClick={close}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="form-label">Nombre *</label>
                <input className="form-input" placeholder="Universidad UTE" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="form-label">País *</label>
                <CountrySelect
                  countries={countries}
                  value={form.countryId}
                  onChange={(id) => setForm({ ...form, countryId: id })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Teléfono</label>
                  <input className="form-input" placeholder="+593 2 xxx xxxx" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Correo</label>
                  <input type="email" className="form-input" placeholder="contacto@universidad.edu" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="form-label">Dirección</label>
                <input className="form-input" placeholder="Av. Principal 123, Ciudad" value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Latitud</label>
                  <input className="form-input" placeholder="-0.180653" value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Longitud</label>
                  <input className="form-input" placeholder="-78.467838" value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
                </div>
              </div>
              {form.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${form.name} ${form.address}`)}`}
                  target="_blank" rel="noreferrer"
                  className="text-xs text-primary-600 hover:underline flex items-center gap-1 w-fit"
                >
                  <MapPin size={12} /> Buscar dirección en Google Maps (copie ahí la latitud/longitud)
                </a>
              )}
              <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer bg-gray-50 rounded-lg p-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 mt-0.5 rounded accent-primary-600"
                  checked={form.isHostInstitution}
                  onChange={(e) => setForm({ ...form, isHostInstitution: e.target.checked })}
                />
                <span>
                  <span className="font-medium">Institución organizadora / sede del evento</span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    Activa los campos de Facultad y Semillero, y exige que sus estudiantes postulen tanto Ponencia como Capítulo de Libro.
                  </span>
                </span>
              </label>
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
