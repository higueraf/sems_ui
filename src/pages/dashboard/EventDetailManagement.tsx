import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Plus, Edit2, Trash2, X, Check, Youtube, GripVertical,
  ChevronLeft, Video, Users, Calendar, MapPin, Clock,
} from 'lucide-react';
import { eventsApi } from '../../api/events.api';
import { ScientificEvent, EventVideo, Workshop } from '../../types';
import { formatDate } from '../../utils';

// // Helper para YouTube
function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0];
    const v = u.searchParams.get('v');
    if (v) return v;
    const m = u.pathname.match(/\/(live|shorts|embed|v)\/([^/?&]+)/);
    if (m) return m[2];
    return null;
  } catch {
    return null;
  }
}

function getYouTubeThumbnail(url: string): string {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
}

// // Form states
interface VideoFormState {
  title: string;
  description?: string;
  youtubeUrl: string;
  displayOrder: number;
}

interface WorkshopFormState {
  title: string;
  description?: string;
  instructor?: string;
  duration?: number;
  maxCapacity?: number;
  prerequisites?: string;
  registrationUrl?: string;
  materialsUrl?: string;
  youtubeUrl?: string;
  displayOrder: number;
  status: string;
}

const emptyVideoForm = (): VideoFormState => ({
  title: '',
  description: '',
  youtubeUrl: '',
  displayOrder: 0,
});

const emptyWorkshopForm = (): WorkshopFormState => ({
  title: '',
  description: '',
  instructor: '',
  duration: 0,
  maxCapacity: 0,
  prerequisites: '',
  registrationUrl: '',
  materialsUrl: '',
  youtubeUrl: '',
  displayOrder: 0,
  status: 'active',
});

// // Componente de gestión de videos
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
    if (!form.title.trim() || !form.youtubeUrl.trim()) {
      return toast.error('Título y URL de YouTube son requeridos');
    }

    if (editingVideo) {
      updateMutation.mutate({ id: editingVideo.id, data: form });
    } else {
      addMutation.mutate(form);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Video size={20} className="text-red-500" />
          Videos del Evento
          <span className="text-sm text-gray-500">({videos?.length || 0})</span>
        </h3>
        <button
          onClick={openAdd}
          className="btn-primary btn-sm flex items-center gap-1 text-white"
        >
          <Plus size={16} /> Agregar Video
        </button>
      </div>

      {isLoading && <div className="text-center py-8 text-gray-400">Cargando videos...</div>}

      {/* Lista de videos */}
      {!isLoading && videos && videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v) => {
            const thumbnail = getYouTubeThumbnail(v.youtubeUrl);
            return (
              <div key={v.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {thumbnail ? (
                  <img src={thumbnail} alt={v.title} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                    <Youtube size={32} className="text-gray-400" />
                  </div>
                )}
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 truncate">{v.title}</h4>
                  {v.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{v.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-500">Orden: {v.displayOrder}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(v)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar el video "${v.title}"?`)) {
                            deleteMutation.mutate(v.id);
                          }
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && (!videos || videos.length === 0) && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Video size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">No hay videos agregados</p>
          <button onClick={openAdd} className="btn-primary btn-sm text-white">
            Agregar primer video
          </button>
        </div>
      )}

      {/* Formulario inline */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">
              {editingVideo ? 'Editar Video' : 'Nuevo Video'}
            </h4>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="form-label">Título *</label>
              <input
                className="form-input"
                placeholder="Título del video"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">Descripción</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Descripción del video (opcional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">URL de YouTube *</label>
              <input
                className="form-input"
                placeholder="https://www.youtube.com/watch?v=..."
                value={form.youtubeUrl}
                onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
              />
            </div>

            <div className="w-32">
              <label className="form-label">Orden</label>
              <input
                type="number"
                className="form-input"
                min={0}
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button onClick={closeForm} className="btn-outline">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={addMutation.isPending || updateMutation.isPending}
                className="btn-primary flex items-center gap-1 text-white"
              >
                <Check size={16} />
                {editingVideo ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// // Componente de gestión de talleres
function EventWorkshopsPanel({ event }: { event: ScientificEvent }) {
  const qc = useQueryClient();

  const { data: workshops, isLoading } = useQuery({
    queryKey: ['event-workshops', event.id],
    queryFn: () => eventsApi.getWorkshopsByEvent(event.id),
  });

  const [showForm, setShowForm] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [form, setForm] = useState<WorkshopFormState>(emptyWorkshopForm());

  const invalidate = () => qc.invalidateQueries({ queryKey: ['event-workshops', event.id] });

  const addMutation = useMutation({
    mutationFn: (data: WorkshopFormState) => eventsApi.addWorkshop(event.id, data),
    onSuccess: () => { toast.success('Taller agregado'); invalidate(); closeForm(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkshopFormState> }) =>
      eventsApi.updateWorkshop(id, data),
    onSuccess: () => { toast.success('Taller actualizado'); invalidate(); closeForm(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventsApi.removeWorkshop(id),
    onSuccess: () => { toast.success('Taller eliminado'); invalidate(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const openAdd = () => {
    setEditingWorkshop(null);
    setForm({ ...emptyWorkshopForm(), displayOrder: workshops?.length ?? 0 });
    setShowForm(true);
  };

  const openEdit = (w: Workshop) => {
    setEditingWorkshop(w);
    setForm({
      title: w.title,
      description: w.description ?? '',
      instructor: w.instructor ?? '',
      duration: w.duration ?? 0,
      maxCapacity: w.maxCapacity ?? 0,
      prerequisites: w.prerequisites ?? '',
      registrationUrl: w.registrationUrl ?? '',
      materialsUrl: w.materialsUrl ?? '',
      youtubeUrl: w.youtubeUrl ?? '',
      displayOrder: w.displayOrder,
      status: w.status,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingWorkshop(null);
    setForm(emptyWorkshopForm());
  };

  const handleSave = () => {
    if (!form.title.trim()) return toast.error('El título es requerido');

    if (editingWorkshop) {
      updateMutation.mutate({ id: editingWorkshop.id, data: form });
    } else {
      addMutation.mutate(form);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Users size={20} className="text-amber-500" />
          Talleres del Evento
          <span className="text-sm text-gray-500">({workshops?.length || 0})</span>
        </h3>
        <button
          onClick={openAdd}
          className="btn-primary btn-sm flex items-center gap-1 text-white"
        >
          <Plus size={16} /> Agregar Taller
        </button>
      </div>

      {isLoading && <div className="text-center py-8 text-gray-400">Cargando talleres...</div>}

      {/* Lista de talleres */}
      {!isLoading && workshops && workshops.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workshops.map((w) => {
            const thumbnail = w.youtubeUrl ? getYouTubeThumbnail(w.youtubeUrl) : null;
            return (
              <div key={w.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {thumbnail ? (
                  <img src={thumbnail} alt={w.title} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                    <Users size={32} className="text-gray-400" />
                  </div>
                )}
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 truncate">{w.title}</h4>
                  {w.instructor && (
                    <p className="text-sm text-gray-600 mt-1">Instructor: {w.instructor}</p>
                  )}
                  {w.duration && (
                    <p className="text-sm text-gray-600">Duración: {w.duration}h</p>
                  )}
                  {w.youtubeUrl && (
                    <p className="text-xs text-green-600 mt-1">Con video</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-500">Estado: {w.status}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(w)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar el taller "${w.title}"?`)) {
                            deleteMutation.mutate(w.id);
                          }
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && (!workshops || workshops.length === 0) && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">No hay talleres agregados</p>
          <button onClick={openAdd} className="btn-primary btn-sm text-white">
            Agregar primer taller
          </button>
        </div>
      )}

      {/* Formulario inline */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">
              {editingWorkshop ? 'Editar Taller' : 'Nuevo Taller'}
            </h4>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Título *</label>
              <input
                className="form-input"
                placeholder="Título del taller"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">Instructor</label>
              <input
                className="form-input"
                placeholder="Nombre del instructor"
                value={form.instructor}
                onChange={(e) => setForm({ ...form, instructor: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="form-label">Descripción</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Descripción del taller (opcional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">Duración (horas)</label>
              <input
                type="number"
                className="form-input"
                min={0}
                placeholder="2"
                value={form.duration || ''}
                onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div>
              <label className="form-label">Cupo máximo</label>
              <input
                type="number"
                className="form-input"
                min={0}
                placeholder="20"
                value={form.maxCapacity || ''}
                onChange={(e) => setForm({ ...form, maxCapacity: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div>
              <label className="form-label">URL de YouTube</label>
              <input
                className="form-input"
                placeholder="https://www.youtube.com/watch?v=..."
                value={form.youtubeUrl}
                onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">Estado</label>
              <select
                className="form-input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Activo</option>
                <option value="completed">Completado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="form-label">URL de inscripción</label>
              <input
                className="form-input"
                placeholder="https://..."
                value={form.registrationUrl}
                onChange={(e) => setForm({ ...form, registrationUrl: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">URL de materiales</label>
              <input
                className="form-input"
                placeholder="https://..."
                value={form.materialsUrl}
                onChange={(e) => setForm({ ...form, materialsUrl: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="form-label">Prerrequisitos</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Prerrequisitos del taller (opcional)"
                value={form.prerequisites}
                onChange={(e) => setForm({ ...form, prerequisites: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">Orden</label>
              <input
                type="number"
                className="form-input"
                min={0}
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button onClick={closeForm} className="btn-outline">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={addMutation.isPending || updateMutation.isPending}
              className="btn-primary flex items-center gap-1 text-white"
            >
              <Check size={16} />
              {editingWorkshop ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// // Componente principal
export default function EventDetailManagement({ 
  eventId, 
  onBack 
}: { 
  eventId: string; 
  onBack: () => void; 
}) {
  const [activeTab, setActiveTab] = useState<'details' | 'videos' | 'workshops'>('details');

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.getOne(eventId),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Evento no encontrado</p>
        <button onClick={onBack} className="btn-primary mt-4 text-white">
          Volver a la lista
        </button>
      </div>
    );
  }

  const FORMAT_LABELS: Record<string, string> = {
    in_person: 'Presencial',
    online: 'En línea',
    hybrid: 'Híbrido',
  };

  const tabs = [
    { id: 'details', label: 'Detalles', icon: Calendar },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'workshops', label: 'Talleres', icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="btn-outline flex items-center gap-2"
        >
          <ChevronLeft size={16} />
          Volver
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
          {event.tagline && (
            <p className="text-gray-600 mt-1">{event.tagline}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información General</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {formatDate(event.startDate)} {event.endDate && event.endDate !== event.startDate && `- ${formatDate(event.endDate)}`}
                    </span>
                  </div>
                  {(event.city || event.country) && (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {[event.city, event.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Formato: <span className="font-medium">{FORMAT_LABELS[event.format] || event.format}</span>
                    </span>
                  </div>
                  {event.certifiedHours && (
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {event.certifiedHours} horas certificadas
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      event.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {event.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                    {event.isAgendaPublished && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Agenda publicada
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {event.description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Descripción</h3>
                <p className="text-gray-600 leading-relaxed">{event.description}</p>
              </div>
            )}

            {event.logoUrl && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Logo</h3>
                <img
                  src={event.logoUrl}
                  alt={event.name}
                  className="h-20 object-contain border border-gray-200 rounded-lg p-2 bg-white"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'videos' && <EventVideosPanel event={event} />}
        {activeTab === 'workshops' && <EventWorkshopsPanel event={event} />}
      </div>
    </div>
  );
}
