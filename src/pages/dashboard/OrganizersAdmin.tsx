import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Plus, Edit2, Trash2, X, Check, Upload, Image,
  ChevronDown, ChevronRight, Users, Building2, UserPlus, User,
} from 'lucide-react';
import { eventsApi } from '../../api/events.api';
import { organizersApi, countriesApi } from '../../api/index';
import { Organizer, OrganizerMember } from '../../types';
import { ORGANIZER_ROLE_LABELS, getFileUrl } from '../../utils';

// ─── Labels de roles de miembro ──────────────────────────────────────────────
const MEMBER_ROLE_LABELS: Record<string, string> = {
  rector:       'Rector/a',
  vice_rector:  'Vicerrector/a',
  dean:         'Decano/a',
  director:     'Director/a',
  researcher:   'Investigador/a',
  coordinator:  'Coordinador/a',
  speaker:      'Conferencista',
  panelist:     'Panelista',
  committee:    'Comité',
  contact:      'Contacto',
  other:        'Otro',
};

// ─── Formulario vacío para institución ───────────────────────────────────────
const EMPTY_ORG = {
  type: 'institution', name: '', shortName: '', role: 'co_organizer', description: '',
  countryId: '', website: '', displayOrder: 0, isVisible: true,
};

// ─── Formulario vacío para persona ───────────────────────────────────────────
const EMPTY_PERSON = {
  type: 'person', name: '', title: '', institutionalPosition: '',
  role: 'organizing_committee', bio: '',
  email: '', phone: '', countryId: '', displayOrder: 0, isVisible: true,
};

const PERSON_ROLE_LABELS: Record<string, string> = {
  organizing_committee: 'Comité Organizador',
  scientific_committee: 'Comité Científico',
  keynote_speaker:      'Conferencista',
  contact:              'Contacto',
  co_organizer:         'Co-organizador/a',
};

// ─── Formulario vacío para miembro ───────────────────────────────────────────
const EMPTY_MEMBER = {
  fullName: '', academicTitle: '', institutionalPosition: '',
  role: 'committee', roleLabel: '', bio: '',
  email: '', phone: '', countryId: '', displayOrder: 0, isVisible: true,
};

// ─── Sub-componente: panel de miembros de una institución ────────────────────
function MembersPanel({ organizer }: { organizer: Organizer }) {
  const qc = useQueryClient();
  const photoRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<OrganizerMember | null>(null);
  const [form, setForm] = useState<any>(EMPTY_MEMBER);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);

  const { data: countries } = useQuery({ queryKey: ['countries'], queryFn: () => countriesApi.getAll(true) });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['organizers-admin'] });
    qc.invalidateQueries({ queryKey: ['organizers-public'] });
  };

  const createM = useMutation({
    mutationFn: (data: any) => organizersApi.createMember(organizer.id, data),
    onSuccess: () => { toast.success('Miembro agregado'); invalidate(); closeForm(); },
    onError: () => toast.error('Error al crear miembro'),
  });

  const updateM = useMutation({
    mutationFn: ({ id, data }: any) => organizersApi.updateMember(id, data),
    onSuccess: () => { toast.success('Miembro actualizado'); invalidate(); closeForm(); },
    onError: () => toast.error('Error al actualizar'),
  });

  const deleteM = useMutation({
    mutationFn: organizersApi.removeMember,
    onSuccess: () => { toast.success('Miembro eliminado'); invalidate(); },
  });

  const closeForm = () => { setShowForm(false); setEditingMember(null); setForm(EMPTY_MEMBER); };
  const openEdit = (m: OrganizerMember) => { setEditingMember(m); setForm({ ...m }); setShowForm(true); };

  const handleSave = () => {
    if (!form.fullName) return toast.error('Nombre requerido');
    if (editingMember) updateM.mutate({ id: editingMember.id, data: form });
    else createM.mutate(form);
  };

  const handlePhotoUpload = async (memberId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(memberId);
    try {
      await organizersApi.uploadMemberPhoto(memberId, file);
      invalidate();
      toast.success('Foto actualizada');
    } catch {
      toast.error('Error al subir foto');
    } finally {
      setUploadingPhoto(null);
      if (photoRef.current) photoRef.current.value = '';
    }
  };

  const members = organizer.members ?? [];

  return (
    <div className="border-t border-gray-100 bg-gray-50">
      <div className="px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Users size={13} /> Responsables / Miembros ({members.length})
        </span>
        <button
          onClick={() => { setEditingMember(null); setForm(EMPTY_MEMBER); setShowForm(true); }}
          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-semibold"
        >
          <UserPlus size={13} /> Agregar persona
        </button>
      </div>

      {/* Lista de miembros */}
      {members.length > 0 && (
        <div className="px-4 pb-3 space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3">
              {/* Foto */}
              <div className="relative flex-shrink-0">
                {m.photoUrl ? (
                  <img
                    src={getFileUrl(m.photoUrl)}
                    alt={m.fullName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <Image size={18} className="text-gray-400" />
                  </div>
                )}
                {/* Botón subir foto encima */}
                <label
                  htmlFor={`photo-${m.id}`}
                  className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary-600 hover:bg-primary-700
                    rounded-full flex items-center justify-center cursor-pointer shadow-md"
                  title="Subir foto"
                >
                  {uploadingPhoto === m.id
                    ? <span className="w-2 h-2 border border-white rounded-full animate-spin border-t-transparent" />
                    : <Upload size={10} className="text-white" />}
                </label>
                <input
                  id={`photo-${m.id}`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(m.id, e)}
                  disabled={!!uploadingPhoto}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-800 truncate">
                  {m.academicTitle ? `${m.academicTitle} ` : ''}{m.fullName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {m.institutionalPosition && <span>{m.institutionalPosition} · </span>}
                  <span className="text-primary-600 font-medium">
                    {m.roleLabel || MEMBER_ROLE_LABELS[m.role] || m.role}
                  </span>
                </p>
                {m.email && <p className="text-xs text-gray-400 truncate">{m.email}</p>}
              </div>

              {/* Acciones */}
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => openEdit(m)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => { if (confirm('¿Eliminar miembro?')) deleteM.mutate(m.id); }}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulario inline de miembro */}
      {showForm && (
        <div className="mx-4 mb-4 bg-white rounded-xl border border-primary-200 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-bold text-sm text-gray-700">
              {editingMember ? 'Editar persona' : 'Nueva persona'}
            </span>
            <button onClick={closeForm}><X size={16} className="text-gray-400" /></button>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {[
              { label: 'Nombre completo *', field: 'fullName', col: 2 },
              { label: 'Título académico',  field: 'academicTitle', col: 1 },
              { label: 'Cargo institucional', field: 'institutionalPosition', col: 1 },
            ].map(({ label, field, col }) => (
              <div key={field} style={{ gridColumn: `span ${col}` }}>
                <label className="form-label">{label}</label>
                <input
                  type="text"
                  className="form-input"
                  value={form[field] || ''}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                />
              </div>
            ))}

            <div>
              <label className="form-label">Rol en el simposio</label>
              <select className="form-input" value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {Object.entries(MEMBER_ROLE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Etiqueta personalizada del rol</label>
              <input type="text" className="form-input" placeholder="ej. Presidente del Comité"
                value={form.roleLabel || ''}
                onChange={(e) => setForm({ ...form, roleLabel: e.target.value })} />
            </div>

            <div>
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>

            <div>
              <label className="form-label">Teléfono</label>
              <input type="text" className="form-input" value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>

            <div>
              <label className="form-label">País</label>
              <select className="form-input" value={form.countryId || ''}
                onChange={(e) => setForm({ ...form, countryId: e.target.value })}>
                <option value="">Sin país</option>
                {countries?.map((c) => (
                  <option key={c.id} value={c.id}>{c.flagEmoji} {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Orden</label>
              <input type="number" className="form-input" value={form.displayOrder || 0}
                onChange={(e) => setForm({ ...form, displayOrder: +e.target.value })} />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Biografía</label>
              <textarea rows={2} className="form-input resize-none" value={form.bio || ''}
                onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>

            <div style={{ gridColumn: 'span 2' }} className="flex justify-end gap-2 pt-1">
              <button onClick={closeForm} className="btn-outline btn-sm">Cancelar</button>
              <button onClick={handleSave} className="btn-primary btn-sm flex items-center gap-1">
                <Check size={13} /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function OrganizersAdmin() {
  const qc = useQueryClient();
  const logoRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Organizer | null>(null);
  const [form, setForm] = useState<any>(EMPTY_ORG);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Organizer | null>(null);
  const [personForm, setPersonForm] = useState<any>(EMPTY_PERSON);
  const [uploadingPersonPhoto, setUploadingPersonPhoto] = useState<string | null>(null);

  const { data: event } = useQuery({ queryKey: ['event-active'], queryFn: eventsApi.getActive });
  const { data: organizers, isLoading } = useQuery({
    queryKey: ['organizers-admin', event?.id],
    queryFn: () => organizersApi.getAll(event!.id),
    enabled: !!event?.id,
  });
  const { data: countries } = useQuery({ queryKey: ['countries'], queryFn: () => countriesApi.getAll(true) });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['organizers-admin'] });
    qc.invalidateQueries({ queryKey: ['organizers-public'] });
  };

  const createM = useMutation({
    mutationFn: organizersApi.create,
    onSuccess: () => { toast.success('Institución creada'); invalidate(); close(); },
    onError: () => toast.error('Error al crear'),
  });

  const updateM = useMutation({
    mutationFn: ({ id, data }: any) => organizersApi.update(id, data),
    onSuccess: () => { toast.success('Actualizado'); invalidate(); close(); },
  });

  const deleteM = useMutation({
    mutationFn: organizersApi.remove,
    onSuccess: () => { toast.success('Eliminado'); invalidate(); },
  });

  const close = () => { setShowForm(false); setEditing(null); setForm(EMPTY_ORG); };
  const closePerson = () => { setShowPersonForm(false); setEditingPerson(null); setPersonForm(EMPTY_PERSON); };

  const openEdit = (o: Organizer) => {
    setEditing(o);
    setForm({ ...o, countryId: o.country?.id || '' });
    setShowForm(true);
  };

  const openEditPerson = (p: Organizer) => {
    setEditingPerson(p);
    setPersonForm({ ...p, countryId: p.country?.id || '' });
    setShowPersonForm(true);
  };

  const handleSave = () => {
    if (!form.name) return toast.error('Nombre requerido');
    const payload = { ...form, eventId: event!.id };
    if (editing) updateM.mutate({ id: editing.id, data: payload });
    else createM.mutate(payload);
  };

  const handleSavePerson = () => {
    if (!personForm.name) return toast.error('Nombre requerido');
    const payload = { ...personForm, eventId: event!.id };
    if (editingPerson) updateM.mutate({ id: editingPerson.id, data: payload });
    else createM.mutate(payload);
    closePerson();
  };

  const handlePersonPhotoUpload = async (org: Organizer, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPersonPhoto(org.id);
    try {
      await organizersApi.uploadPhoto(org.id, file);
      invalidate();
      toast.success('Foto actualizada');
    } catch {
      toast.error('Error al subir foto');
    } finally {
      setUploadingPersonPhoto(null);
      e.target.value = '';
    }
  };

  const handleLogoUpload = async (org: Organizer, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      await organizersApi.uploadLogo(org.id, file);
      invalidate();
      toast.success('Logo actualizado');
    } catch {
      toast.error('Error al subir logo');
    } finally {
      setUploadingLogo(false);
      if (logoRef.current) logoRef.current.value = '';
    }
  };

  return (
    <div className="space-y-5">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-gray-900">Organizadores</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Instituciones y sus responsables en el simposio
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm({ ...EMPTY_ORG, eventId: event?.id }); setShowForm(true); }}
          className="btn-primary btn-sm flex items-center gap-1"
        >
          <Plus size={16} /> Nueva institución
        </button>
      </div>

      {/* ── Tabla de instituciones ──────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : !organizers?.length ? (
          <div className="p-12 text-center text-gray-400">
            <Building2 size={40} className="mx-auto mb-3 opacity-30" />
            <p>No hay instituciones registradas</p>
          </div>
        ) : (
          <div>
            {organizers.map((org) => (
              <div key={org.id} className="border-b border-gray-100 last:border-0">
                {/* Fila principal */}
                <div className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                  {/* Expandir */}
                  <button
                    onClick={() => setExpandedId(expandedId === org.id ? null : org.id)}
                    className="text-gray-400 hover:text-primary-600 transition-colors flex-shrink-0"
                  >
                    {expandedId === org.id
                      ? <ChevronDown size={16} />
                      : <ChevronRight size={16} />}
                  </button>

                  {/* Logo con botón de subida */}
                  <div className="relative flex-shrink-0">
                    {org.logoUrl ? (
                      <img
                        src={getFileUrl(org.logoUrl)}
                        alt={org.name}
                        className="w-12 h-10 object-contain rounded border border-gray-100 bg-gray-50 p-1"
                      />
                    ) : (
                      <div className="w-12 h-10 bg-gray-100 rounded flex items-center justify-center">
                        <Image size={16} className="text-gray-300" />
                      </div>
                    )}
                    <label
                      htmlFor={`logo-${org.id}`}
                      className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary-600 hover:bg-primary-700
                        rounded-full flex items-center justify-center cursor-pointer shadow"
                      title="Subir logo"
                    >
                      {uploadingLogo
                        ? <span className="w-2 h-2 border border-white rounded-full animate-spin border-t-transparent" />
                        : <Upload size={9} className="text-white" />}
                    </label>
                    <input
                      id={`logo-${org.id}`}
                      type="file" accept="image/*" className="hidden"
                      onChange={(e) => handleLogoUpload(org, e)}
                      disabled={uploadingLogo}
                    />
                  </div>

                  {/* Nombre e info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-800 truncate">{org.name}</span>
                      {org.shortName && (
                        <span className="badge bg-gray-100 text-gray-500 text-xs flex-shrink-0">
                          {org.shortName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-primary-600 font-medium">
                        {ORGANIZER_ROLE_LABELS[org.role] || org.role}
                      </span>
                      {org.country && (
                        <span className="text-xs text-gray-400">
                          {org.country.flagEmoji} {org.country.name}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Users size={11} />
                        {org.members?.length ?? 0} miembro{(org.members?.length ?? 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(org)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => { if (confirm('¿Eliminar esta institución y todos sus miembros?')) deleteM.mutate(org.id); }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Panel de miembros (expandible) */}
                {expandedId === org.id && <MembersPanel organizer={org} />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Sección de personas responsables ───────────────────────── */}
      {(() => {
        const persons = (organizers ?? []).filter((o) => o.type === 'person');
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading font-bold text-lg text-gray-800 flex items-center gap-2">
                  <User size={18} className="text-primary-500" /> Equipo Organizador
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Personas responsables — con foto para la página pública</p>
              </div>
              <button
                onClick={() => { setEditingPerson(null); setPersonForm({ ...EMPTY_PERSON }); setShowPersonForm(true); }}
                className="btn-outline btn-sm flex items-center gap-1"
              >
                <UserPlus size={15} /> Nueva persona
              </button>
            </div>

            {persons.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
                <User size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay personas registradas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {persons.map((p) => (
                  <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
                    {/* Foto con upload */}
                    <div className="relative flex-shrink-0">
                      {p.photoUrl ? (
                        <img
                          src={getFileUrl(p.photoUrl)}
                          alt={p.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                          <User size={22} className="text-gray-300" />
                        </div>
                      )}
                      <label
                        htmlFor={`person-photo-${p.id}`}
                        className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary-600 hover:bg-primary-700
                          rounded-full flex items-center justify-center cursor-pointer shadow"
                        title="Subir foto"
                      >
                        {uploadingPersonPhoto === p.id
                          ? <span className="w-2 h-2 border border-white rounded-full animate-spin border-t-transparent" />
                          : <Upload size={9} className="text-white" />}
                      </label>
                      <input
                        id={`person-photo-${p.id}`}
                        type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                        onChange={(e) => handlePersonPhotoUpload(p, e)}
                        disabled={!!uploadingPersonPhoto}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">
                        {p.title ? `${p.title} ` : ''}{p.name}
                      </p>
                      {p.institutionalPosition && (
                        <p className="text-xs text-gray-500 truncate">{p.institutionalPosition}</p>
                      )}
                      <span className="badge bg-primary-50 text-primary-700 text-[10px] mt-1">
                        {PERSON_ROLE_LABELS[p.role] || ORGANIZER_ROLE_LABELS[p.role] || p.role}
                      </span>
                      {p.email && <p className="text-xs text-gray-400 mt-1 truncate">{p.email}</p>}
                      {!p.photoUrl && (
                        <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1">
                          <Image size={9} /> Sin foto
                        </p>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button onClick={() => openEditPerson(p)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => { if (confirm('\u00bfEliminar esta persona?')) deleteM.mutate(p.id); }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Modal de persona */}
      {showPersonForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg">
                {editingPerson ? 'Editar persona' : 'Nueva persona'}
              </h3>
              <button onClick={closePerson}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="form-label">Nombre completo *</label>
                <input type="text" className="form-input" value={personForm.name}
                  onChange={(e) => setPersonForm({ ...personForm, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Título académico</label>
                  <input type="text" className="form-input" placeholder="Dr., Mg., Lic.…"
                    value={personForm.title || ''}
                    onChange={(e) => setPersonForm({ ...personForm, title: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Rol en el simposio</label>
                  <select className="form-input" value={personForm.role}
                    onChange={(e) => setPersonForm({ ...personForm, role: e.target.value })}>
                    {Object.entries(PERSON_ROLE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Cargo institucional</label>
                <input type="text" className="form-input"
                  placeholder="Rector, Directora de Investigación…"
                  value={personForm.institutionalPosition || ''}
                  onChange={(e) => setPersonForm({ ...personForm, institutionalPosition: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={personForm.email || ''}
                    onChange={(e) => setPersonForm({ ...personForm, email: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Teléfono</label>
                  <input type="text" className="form-input" value={personForm.phone || ''}
                    onChange={(e) => setPersonForm({ ...personForm, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="form-label">País</label>
                <select className="form-input" value={personForm.countryId || ''}
                  onChange={(e) => setPersonForm({ ...personForm, countryId: e.target.value })}>
                  <option value="">Sin país</option>
                  {countries?.map((c) => (
                    <option key={c.id} value={c.id}>{c.flagEmoji} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Biografía</label>
                <textarea rows={2} className="form-input resize-none" value={personForm.bio || ''}
                  onChange={(e) => setPersonForm({ ...personForm, bio: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Orden</label>
                  <input type="number" className="form-input" value={personForm.displayOrder || 0}
                    onChange={(e) => setPersonForm({ ...personForm, displayOrder: +e.target.value })} />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={personForm.isVisible}
                      onChange={(e) => setPersonForm({ ...personForm, isVisible: e.target.checked })}
                      className="w-4 h-4 accent-primary-500" />
                    Visible en el sitio
                  </label>
                </div>
              </div>
            </div>
            <div className="p-5 pt-0 flex gap-3 justify-end border-t">
              <button onClick={closePerson} className="btn-outline btn-sm">Cancelar</button>
              <button onClick={handleSavePerson} className="btn-primary btn-sm flex items-center gap-1">
                <Check size={15} /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de institución */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg">
                {editing ? 'Editar institución' : 'Nueva institución'}
              </h3>
              <button onClick={close}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="form-label">Nombre completo *</label>
                <input type="text" className="form-input" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Siglas</label>
                  <input type="text" className="form-input" value={form.shortName || ''}
                    onChange={(e) => setForm({ ...form, shortName: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Rol</label>
                  <select className="form-input" value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    {Object.entries(ORGANIZER_ROLE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">País</label>
                <select className="form-input" value={form.countryId || ''}
                  onChange={(e) => setForm({ ...form, countryId: e.target.value })}>
                  <option value="">Sin país</option>
                  {countries?.map((c) => (
                    <option key={c.id} value={c.id}>{c.flagEmoji} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Sitio web</label>
                <input type="text" className="form-input" placeholder="https://..."
                  value={form.website || ''}
                  onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Descripción</label>
                <textarea rows={2} className="form-input resize-none" value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Orden</label>
                  <input type="number" className="form-input" value={form.displayOrder || 0}
                    onChange={(e) => setForm({ ...form, displayOrder: +e.target.value })} />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.isVisible}
                      onChange={(e) => setForm({ ...form, isVisible: e.target.checked })}
                      className="w-4 h-4 accent-primary-500" />
                    Visible en el sitio
                  </label>
                </div>
              </div>
            </div>
            <div className="p-5 pt-0 flex gap-3 justify-end border-t">
              <button onClick={close} className="btn-outline btn-sm">Cancelar</button>
              <button onClick={handleSave} className="btn-primary btn-sm flex items-center gap-1">
                <Check size={15} /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
