import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Plus, Edit2, Trash2, X, Check, Upload, FileText, Presentation,
  FileIcon, Trash, Download, Loader2,
} from 'lucide-react';
import { eventsApi } from '../../api/events.api';
import { guidelinesApi } from '../../api/index';
import { Guideline } from '../../types';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace('/api', '') ?? 'http://localhost:3000';

const EMPTY = {
  title: '',
  content: '',
  category: 'general',
  iconName: '',
  displayOrder: 0,
  isVisible: true,
};

const CAT_LABELS: Record<string, string> = {
  format: 'Formato',
  submission: 'Envío',
  evaluation: 'Evaluación',
  publication: 'Publicación',
  general: 'General',
};

/** Ícono según el tipo MIME del archivo */
function FileTypeIcon({ mimeType, size = 16 }: { mimeType?: string | null; size?: number }) {
  if (!mimeType) return <FileIcon size={size} />;
  if (mimeType.includes('pdf')) return <FileText size={size} className="text-red-500" />;
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
    return <Presentation size={size} className="text-orange-500" />;
  return <FileIcon size={size} className="text-blue-500" />;
}

export default function GuidelinesAdmin() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Guideline | null>(null);
  const [form, setForm] = useState<any>(EMPTY);

  // Estado de upload de archivo para la pauta en edición
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: event } = useQuery({ queryKey: ['event-active'], queryFn: eventsApi.getActive });
  const { data: guidelines, isLoading } = useQuery({
    queryKey: ['guidelines-admin', event?.id],
    queryFn: () => guidelinesApi.getAll(event!.id),
    enabled: !!event?.id,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['guidelines-admin'] });
    qc.invalidateQueries({ queryKey: ['guidelines'] });
  };

  const createM = useMutation({
    mutationFn: guidelinesApi.create,
    onSuccess: async (created) => {
      // Si hay archivo pendiente, subirlo a la pauta recién creada
      if (pendingFile) {
        await uploadFileToGuideline(created.id, pendingFile);
      }
      toast.success('Pauta creada correctamente');
      invalidate();
      close();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al crear'),
  });

  const updateM = useMutation({
    mutationFn: ({ id, data }: any) => guidelinesApi.update(id, data),
    onSuccess: async (updated) => {
      if (pendingFile) {
        await uploadFileToGuideline(updated.id, pendingFile);
      }
      toast.success('Pauta actualizada');
      invalidate();
      close();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al actualizar'),
  });

  const deleteM = useMutation({
    mutationFn: guidelinesApi.remove,
    onSuccess: () => { toast.success('Pauta eliminada'); invalidate(); },
  });

  const removeFileM = useMutation({
    mutationFn: (id: string) => guidelinesApi.removeFile(id),
    onSuccess: () => { toast.success('Archivo eliminado'); invalidate(); },
    onError: () => toast.error('Error al eliminar el archivo'),
  });

  /** Sube el archivo a una pauta ya guardada */
  const uploadFileToGuideline = async (id: string, file: File) => {
    setUploadingId(id);
    try {
      await guidelinesApi.uploadFile(id, file);
      toast.success('Archivo adjuntado correctamente');
    } catch {
      toast.error('Error al subir el archivo adjunto');
    } finally {
      setUploadingId(null);
      setPendingFile(null);
    }
  };

  /** Upload inmediato para una pauta ya existente (sin abrir el formulario) */
  const handleQuickUpload = async (guideline: Guideline, file: File) => {
    await uploadFileToGuideline(guideline.id, file);
    invalidate();
  };

  const close = () => {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY);
    setPendingFile(null);
  };

  const openEdit = (g: Guideline) => {
    setEditing(g);
    setForm({ ...g });
    setPendingFile(null);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.title || !form.content) return toast.error('Título y contenido son requeridos');
    const payload = { ...form, eventId: event!.id };
    if (editing) updateM.mutate({ id: editing.id, data: payload });
    else createM.mutate(payload);
  };

  const isSaving = createM.isPending || updateM.isPending;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl text-gray-900">Pautas de Publicación</h1>
        <button
          onClick={() => { setEditing(null); setForm(EMPTY); setPendingFile(null); setShowForm(true); }}
          className="btn-primary btn-sm flex items-center gap-1"
        >
          <Plus size={16} /> Nueva Pauta
        </button>
      </div>

      {/* Lista de pautas */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="card text-center text-gray-400 py-8">Cargando pautas...</div>
        ) : guidelines?.length === 0 ? (
          <div className="card text-center text-gray-400 py-8">No hay pautas creadas aún.</div>
        ) : (
          guidelines?.map((g) => (
            <div key={g.id} className="card !py-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                {/* Badges de categoría y estado */}
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="badge bg-blue-100 text-blue-700 text-xs">
                    {CAT_LABELS[g.category] || g.category}
                  </span>
                  {!g.isVisible && (
                    <span className="badge bg-gray-100 text-gray-500 text-xs">Oculto</span>
                  )}
                  <span className="text-xs text-gray-400">Orden: {g.displayOrder}</span>
                </div>

                <h3 className="font-semibold text-gray-900">{g.title}</h3>
                <div
                  className="text-xs text-gray-400 mt-1 line-clamp-2"
                  dangerouslySetInnerHTML={{ __html: g.content }}
                />

                {/* Archivo adjunto actual */}
                {g.fileUrl ? (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                      <FileTypeIcon mimeType={g.fileMimeType} size={14} />
                      <span className="truncate max-w-[200px]">{g.fileName}</span>
                    </div>
                    <a
                      href={`${API_BASE}${g.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={g.fileName ?? true}
                      className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                    >
                      <Download size={12} />
                      Descargar
                    </a>
                    <button
                      onClick={() => {
                        if (confirm('¿Eliminar el archivo adjunto de esta pauta?')) {
                          removeFileM.mutate(g.id);
                        }
                      }}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                    >
                      <Trash size={12} />
                      Quitar
                    </button>
                  </div>
                ) : (
                  /* Upload rápido si no tiene archivo */
                  <div className="mt-2">
                    <label className="inline-flex items-center gap-1.5 text-xs text-primary-600 cursor-pointer hover:text-primary-800">
                      {uploadingId === g.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Upload size={13} />
                      )}
                      {uploadingId === g.id ? 'Subiendo...' : 'Adjuntar archivo (PDF/PPTX/DOCX)'}
                      <input
                        type="file"
                        accept=".pdf,.pptx,.ppt,.docx,.doc"
                        className="hidden"
                        disabled={!!uploadingId}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleQuickUpload(g, f);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => openEdit(g)}
                  className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
                  title="Editar pauta"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={() => {
                    if (confirm('¿Eliminar esta pauta y su archivo adjunto?')) {
                      deleteM.mutate(g.id);
                    }
                  }}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                  title="Eliminar pauta"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de creación / edición */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
            {/* Header */}
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg">
                {editing ? 'Editar Pauta' : 'Nueva Pauta'}
              </h3>
              <button onClick={close} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto max-h-[65vh]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Categoría</label>
                  <select
                    className="form-input"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {Object.entries(CAT_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Orden de visualización</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.displayOrder || 0}
                    min={0}
                    onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Título *</label>
                <input
                  className="form-input"
                  placeholder="Título de la pauta"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Ícono (nombre Lucide Icon)</label>
                <input
                  className="form-input"
                  placeholder="FileText, Shield, Award, Book..."
                  value={form.iconName || ''}
                  onChange={(e) => setForm({ ...form, iconName: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Contenido * (HTML permitido)</label>
                <textarea
                  rows={10}
                  className="form-input resize-y font-mono text-xs"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="<p>Descripción de la pauta...</p>&#10;<ul><li>Elemento 1</li></ul>"
                />
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isVisible}
                  onChange={(e) => setForm({ ...form, isVisible: e.target.checked })}
                  className="w-4 h-4 accent-primary-500"
                />
                Visible en el sitio público
              </label>

              {/* Sección de archivo adjunto */}
              <div className="border-t pt-4">
                <label className="form-label mb-2 block">
                  Archivo adjunto de apoyo (PDF, PPTX, DOCX — máx. 20 MB)
                </label>

                {/* Si ya tiene archivo (en edición) */}
                {editing?.fileUrl && !pendingFile && (
                  <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <FileTypeIcon mimeType={editing.fileMimeType} size={20} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {editing.fileName}
                      </p>
                      <p className="text-xs text-gray-400">Archivo actual</p>
                    </div>
                    <a
                      href={`${API_BASE}${editing.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={editing.fileName ?? true}
                      className="text-primary-600 hover:text-primary-800"
                      title="Descargar archivo actual"
                    >
                      <Download size={16} />
                    </a>
                  </div>
                )}

                {/* Zona de drop / selección */}
                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={28} className="mx-auto text-gray-400 mb-2" />
                  {pendingFile ? (
                    <div>
                      <p className="text-sm font-medium text-primary-700 flex items-center justify-center gap-2">
                        <Check size={16} />
                        {pendingFile.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {(pendingFile.size / 1024 / 1024).toFixed(2)} MB — se subirá al guardar
                      </p>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setPendingFile(null); }}
                        className="mt-2 text-xs text-red-500 hover:text-red-700"
                      >
                        Quitar selección
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-500 mb-1">
                        {editing?.fileUrl
                          ? 'Haga clic para reemplazar el archivo actual'
                          : 'Haga clic o arrastre su archivo aquí'}
                      </p>
                      <p className="text-xs text-gray-400">PDF, PPTX o DOCX hasta 20 MB</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.pptx,.ppt,.docx,.doc"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setPendingFile(f);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 pt-0 flex gap-3 justify-end border-t">
              <button onClick={close} className="btn-outline btn-sm">Cancelar</button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary btn-sm flex items-center gap-1"
              >
                {isSaving ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Check size={15} />
                )}
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
