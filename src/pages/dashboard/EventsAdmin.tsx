import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Plus, Edit2, Trash2, X, Check, Youtube, GripVertical,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { eventsApi } from '../../api/events.api';
import { ScientificEvent, EventVideo } from '../../types';
import { formatDate } from '../../utils';

// ── Helper ────────────────────────────────────────────────────────────────────

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    // youtu.be/ID
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0];
    // ?v=ID
    const v = u.searchParams.get('v');
    if (v) return v;
    // /live/ID  /shorts/ID  /embed/ID  /v/ID
    const m = u.pathname.match(/\/(live|shorts|embed|v)\/([^/?&]+)/);
    if (m) return m[2];
    return null;
  } catch {
    return null;
  }
}

function getYouTubeThumbnail(url: string): string {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : '';
}

// ── Panel de videos de un evento ─────────────────────────────────────────────

interface VideoFormState {
  title: string;
  description: string;
  youtubeUrl: string;
  displayOrder: number;
}

const emptyVideoForm = (): VideoFormState => ({
  title: '',
  description: '',
  youtubeUrl: '',
  displayOrder: 0,
});

function EventVideosPanel({ event }: { event: ScientificEvent }) {
  const qc = useQueryClient();

  const { data: videos, isLoading } = useQuery({
    queryKey: ['event-videos', event.id],
    queryFn: () => eventsApi.getVideos(event.id),
  });

  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<EventVideo | null>(null);
  const [form, setForm] = useState<VideoFormState>(emptyVideoForm());

  const invalidate = () => qc.invalidateQueries({ queryKey: ['event-videos', event.id] });

  const addMutation = useMutation({
    mutationFn: (data: VideoFormState) => eventsApi.addVideo(event.id, data),
    onSuccess: () => { toast.success('Video agregado'); invalidate(); closeForm(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VideoFormState> }) =>
      eventsApi.updateVideo(id, data),
    onSuccess: () => { toast.success('Video actualizado'); invalidate(); closeForm(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventsApi.removeVideo(id),
    onSuccess: () => { toast.success('Video eliminado'); invalidate(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const openAdd = () => {
    setEditingVideo(null);
    setForm({ ...emptyVideoForm(), displayOrder: videos?.length ?? 0 });
    setShowForm(true);
  };

  const openEdit = (v: EventVideo) => {
    setEditingVideo(v);
    setForm({
      title: v.title,
      description: v.description ?? '',
      youtubeUrl: v.youtubeUrl,
      displayOrder: v.displayOrder,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingVideo(null);
    setForm(emptyVideoForm());
  };

  const handleSave = () => {
    if (!form.title.trim()) return toast.error('El título es requerido');
    if (!form.youtubeUrl.trim()) return toast.error('La URL de YouTube es requerida');
    if (!getYouTubeId(form.youtubeUrl)) return toast.error('URL de YouTube inválida');

    if (editingVideo) {
      updateMutation.mutate({ id: editingVideo.id, data: form });
    } else {
      addMutation.mutate(form);
    }
  };

  const thumb = getYouTubeThumbnail(form.youtubeUrl);

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <Youtube size={15} className="text-red-500" />
          Videos de YouTube
          {videos && <span className="text-gray-400 font-normal">({videos.length})</span>}
        </h4>
        <button
          onClick={openAdd}
          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
        >
          <Plus size={13} /> Agregar video
        </button>
      </div>

      {isLoading && <p className="text-xs text-gray-400 py-2">Cargando...</p>}

      {/* Lista de videos */}
      {!isLoading && videos && videos.length > 0 && (
        <div className="space-y-2">
          {videos.map((v) => {
            const tUrl = getYouTubeThumbnail(v.youtubeUrl);
            return (
              <div key={v.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-100">
                <GripVertical size={14} className="text-gray-300 flex-shrink-0" />
                {tUrl && (
                  <img
                    src={tUrl}
                    alt={v.title}
                    className="w-16 h-9 object-cover rounded flex-shrink-0 bg-gray-200"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{v.title}</p>
                  {v.description && (
                    <p className="text-xs text-gray-400 truncate">{v.description}</p>
                  )}
                  <p className="text-xs text-gray-400 truncate">{v.youtubeUrl}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(v)}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
                    title="Editar"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar el video "${v.title}"?`)) {
                        deleteMutation.mutate(v.id);
                      }
                    }}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                    title="Eliminar"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && videos && videos.length === 0 && (
        <p className="text-xs text-gray-400 py-2 text-center">
          Aún no hay videos. Agrega el primero.
        </p>
      )}

      {/* Formulario inline */}
      {showForm && (
        <div className="mt-3 p-4 rounded-xl border border-primary-200 bg-primary-50 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-primary-700">
              {editingVideo ? 'Editar video' : 'Nuevo video'}
            </p>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
              <X size={15} />
            </button>
          </div>

          <div>
            <label className="form-label text-xs">URL de YouTube *</label>
            <input
              className="form-input text-sm"
              placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..."
              value={form.youtubeUrl}
              onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
            />
            {/* Preview miniatura */}
            {thumb && (
              <div className="mt-2 flex items-center gap-3">
                <img src={thumb} alt="preview" className="w-24 h-14 object-cover rounded shadow" />
                <p className="text-xs text-green-600 font-medium">✓ URL válida</p>
              </div>
            )}
            {form.youtubeUrl && !thumb && (
              <p className="text-xs text-red-500 mt-1">URL no reconocida. Usa un enlace de YouTube válido.</p>
            )}
          </div>

          <div>
            <label className="form-label text-xs">Título *</label>
            <input
              className="form-input text-sm"
              placeholder="Ej: Ponencia magistral: Ciencia Abierta"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label text-xs">Descripción (opcional)</label>
            <input
              className="form-input text-sm"
              placeholder="Breve descripción del video"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="w-32">
            <label className="form-label text-xs">Orden</label>
            <input
              type="number"
              className="form-input text-sm"
              min={0}
              value={form.displayOrder}
              onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button onClick={closeForm} className="btn-outline btn-sm text-xs">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={addMutation.isPending || updateMutation.isPending}
              className="btn-primary btn-sm text-xs flex items-center gap-1"
            >
              <Check size={13} />
              {editingVideo ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

type CategoryFilter = 'all' | 'symposium' | 'workshop';

export default function EventsAdmin() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ScientificEvent | null>(null);
  const [form, setForm] = useState<Partial<ScientificEvent>>({});
  const [expandedVideos, setExpandedVideos] = useState<Record<string, boolean>>({});
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const { data: events, isLoading } = useQuery({ queryKey: ['events-all'], queryFn: eventsApi.getAll });

  const filteredEvents = (events ?? []).filter((e) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'workshop') return e.category === 'workshop';
    return !e.category || e.category === 'symposium';
  });

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

  const toggleVideos = (id: string) =>
    setExpandedVideos((prev) => ({ ...prev, [id]: !prev[id] }));

  const FORMAT_LABELS: Record<string, string> = { in_person: 'Presencial', online: 'En línea', hybrid: 'Híbrido' };

  const newEventCategory = categoryFilter === 'workshop' ? 'workshop' : 'symposium';
  const newEventLabel = categoryFilter === 'workshop' ? 'Nuevo Taller' : 'Nuevo Simposio';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl text-gray-900">Gestión de Eventos</h1>
        <button
          onClick={() => { setEditing(null); setForm({ format: 'hybrid', isActive: false, category: newEventCategory }); setShowForm(true); }}
          className="btn-primary btn-sm flex items-center gap-1"
        >
          <Plus size={16} /> {newEventLabel}
        </button>
      </div>

      {/* Filtro por categoría */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {(['all', 'symposium', 'workshop'] as CategoryFilter[]).map((cat) => {
          const labels: Record<CategoryFilter, string> = {
            all: 'Todos',
            symposium: 'Simposios',
            workshop: 'Talleres',
          };
          const counts: Record<CategoryFilter, number> = {
            all: (events ?? []).length,
            symposium: (events ?? []).filter((e) => !e.category || e.category === 'symposium').length,
            workshop: (events ?? []).filter((e) => e.category === 'workshop').length,
          };
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                categoryFilter === cat
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {labels[cat]}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                categoryFilter === cat ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {counts[cat]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="card text-center text-gray-400 py-8">Cargando...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="card text-center text-gray-400 py-8">
            {categoryFilter === 'workshop'
              ? 'No hay talleres aún. Crea el primero con "Nuevo Taller".'
              : categoryFilter === 'symposium'
              ? 'No hay simposios aún.'
              : 'No hay eventos aún.'}
          </div>
        ) : filteredEvents.map((e) => (
          <div key={e.id} className={`card border-l-4 ${e.isActive ? 'border-l-primary-500' : 'border-l-gray-300'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
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
                  {e.startDate && <span>📅 {formatDate(e.startDate)} – {formatDate(e.endDate)}</span>}
                  {e.city && <span>📍 {e.city}, {e.country}</span>}
                  {e.certifiedHours && <span>🎓 {e.certifiedHours}h</span>}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleVideos(e.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-1 text-xs font-medium"
                  title="Gestionar videos"
                >
                  <Youtube size={15} />
                  {expandedVideos[e.id] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                <button onClick={() => openEdit(e)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                <button onClick={() => { if (confirm('¿Eliminar este evento?')) deleteMutation.mutate(e.id); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
              </div>
            </div>

            {/* Panel de videos (expandible) */}
            {expandedVideos[e.id] && <EventVideosPanel event={e} />}
          </div>
        ))}
      </div>

      {/* Modal de edición/creación de evento */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg">
                {editing
                  ? `Editar ${editing.category === 'workshop' ? 'Taller' : 'Simposio'}`
                  : form.category === 'workshop' ? 'Nuevo Taller' : 'Nuevo Simposio'}
              </h3>
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
                <label className="form-label">Categoría</label>
                <select className="form-input" value={form.category || 'symposium'} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="symposium">Simposio</option>
                  <option value="workshop">Taller</option>
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
