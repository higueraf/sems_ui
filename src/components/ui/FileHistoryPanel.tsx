/**
 * FileHistoryPanel
 * ─────────────────────────────────────────────────────────────────────────────
 * Panel del dashboard admin para gestionar el historial de versiones
 * de los documentos de una postulación, agrupados por tipo de producto científico.
 *
 * Funcionalidades:
 *  - Listar versiones agrupadas por tipo de producto (más reciente primero)
 *  - Subir nueva versión para un tipo de producto específico
 *  - Promover versión anterior a oficial dentro del mismo tipo
 *  - Descargar cualquier versión
 *  - Indicador visual de versión activa (oficial) por tipo de producto
 */
import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Upload, Download, CheckCircle2, Clock, FileText,
  Star, Loader2, ChevronDown, ChevronUp, Plus, FileWarning,
  Package,
} from 'lucide-react';
import { submissionsApi } from '../../api/submissions.api';
import api from '../../api/axios';
import { SubmissionFile, ScientificProductType } from '../../types';
import { formatDate } from '../../utils';

interface Props {
  submissionId: string;
  files: SubmissionFile[];
  currentFileName?: string;
  /** Tipos de producto científico seleccionados en la postulación */
  productTypes?: ScientificProductType[];
}

const FILE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  manuscript:  { label: 'Inicial',      color: 'bg-blue-100 text-blue-700' },
  correction:  { label: 'Corrección',   color: 'bg-amber-100 text-amber-700' },
  final:       { label: 'Final',        color: 'bg-green-100 text-green-700' },
};

function formatFileSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getAcceptForFormats(formats?: string): string {
  if (!formats)
    return '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const fmts = formats.split(',').map(f => f.trim().toLowerCase());
  const parts: string[] = [];
  if (fmts.includes('docx') || fmts.includes('doc'))
    parts.push('.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  if (fmts.includes('pptx') || fmts.includes('ppt'))
    parts.push('.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation');
  if (fmts.includes('pdf'))
    parts.push('.pdf,application/pdf');
  return parts.join(',') || '.doc,.docx';
}

function getFormatLabel(formats?: string): string {
  if (!formats) return '.doc/.docx — máx 20 MB';
  const fmts = formats.split(',').map(f => f.trim().toLowerCase());
  const labels: string[] = [];
  if (fmts.includes('docx') || fmts.includes('doc')) labels.push('.docx');
  if (fmts.includes('pptx') || fmts.includes('ppt')) labels.push('.pptx');
  if (fmts.includes('pdf'))                           labels.push('.pdf');
  return (labels.join(' / ') || '.docx') + ' — máx 20 MB';
}

// ── Subpanel por tipo de producto ────────────────────────────────────────────

interface ProductTypePanelProps {
  submissionId: string;
  ptId: string | null;   // null = archivos sin tipo (legacy)
  ptName: string;
  allowedFormats?: string;
  files: SubmissionFile[];
  onRefresh: () => void;
}

function ProductTypePanel({
  submissionId, ptId, ptName, allowedFormats, files, onRefresh,
}: ProductTypePanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newFile,        setNewFile]        = useState<File | null>(null);
  const [fileType,       setFileType]       = useState<'correction' | 'final'>('correction');
  const [notes,          setNotes]          = useState('');
  const [uploading,      setUploading]      = useState(false);
  const [activating,     setActivating]     = useState<string | null>(null);
  const [downloading,    setDownloading]    = useState<string | null>(null);

  const accept      = getAcceptForFormats(allowedFormats);
  const formatLabel = getFormatLabel(allowedFormats);

  const handleUpload = async () => {
    if (!newFile) { toast.error('Seleccione un archivo'); return; }
    setUploading(true);
    try {
      await submissionsApi.addFileVersion(
        submissionId, newFile, fileType, notes || undefined, ptId ?? undefined,
      );
      toast.success(`✅ Nueva versión de "${ptName}" subida y marcada como oficial`);
      onRefresh();
      setNewFile(null);
      setNotes('');
      setShowUploadForm(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleActivate = async (fileId: string, version: number) => {
    if (!confirm(`¿Establecer la versión ${version} de "${ptName}" como documento oficial?`)) return;
    setActivating(fileId);
    try {
      await submissionsApi.setActiveFileVersion(submissionId, fileId);
      toast.success(`Versión ${version} establecida como oficial para "${ptName}"`);
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al activar la versión');
    } finally {
      setActivating(null);
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    setDownloading(fileId);
    try {
      const { url } = await submissionsApi.getFileVersionDownloadUrl(fileId);
      if (url.includes('/api/local-files/private/')) {
        const response = await api.get(url, { responseType: 'blob' });
        const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
        const a = document.createElement('a');
        a.href = blobUrl; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.download = fileName;
        document.body.appendChild(a); a.click(); a.remove();
        window.URL.revokeObjectURL(blobUrl);
      } else {
        const a = document.createElement('a');
        a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.download = fileName;
        a.click();
      }
    } catch {
      toast.error('No se pudo generar el enlace de descarga');
    } finally {
      setDownloading(null);
    }
  };

  const activeFile = files.find(f => f.isActive);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Cabecera del tipo de producto */}
      <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Package size={14} className="text-primary-500" />
          <span className="text-sm font-semibold text-gray-700">{ptName}</span>
          <span className="text-xs text-gray-400">({files.length} versión{files.length !== 1 ? 'es' : ''})</span>
        </div>
        <div className="flex items-center gap-2">
          {activeFile && (
            <span className="text-[10px] text-gray-500 truncate max-w-[140px]" title={activeFile.fileName}>
              oficial: {activeFile.fileName}
            </span>
          )}
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium border border-primary-200 rounded-lg px-2 py-1 hover:bg-primary-50 transition-colors"
          >
            <Plus size={12} /> Nueva versión
          </button>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Formulario de subida */}
        {showUploadForm && (
          <div className="border border-primary-200 bg-primary-50/30 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Nueva versión — {ptName}
            </p>

            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-primary-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              {newFile ? (
                <div className="flex items-center justify-center gap-2 text-sm text-primary-700">
                  <FileText size={18} className="text-primary-500" />
                  <span className="font-medium">{newFile.name}</span>
                  <span className="text-gray-400">({formatFileSize(newFile.size)})</span>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">
                  <Upload size={24} className="mx-auto mb-1 text-gray-300" />
                  <p>Clic para seleccionar archivo</p>
                  <p className="text-xs">{formatLabel}</p>
                </div>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setNewFile(f);
                e.target.value = '';
              }}
            />

            <div>
              <label className="form-label">Tipo de versión</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as any)}
                className="form-input text-sm"
              >
                <option value="correction">Corrección — con cambios solicitados</option>
                <option value="final">Final — versión definitiva aprobada</option>
              </select>
            </div>

            <div>
              <label className="form-label">Nota / descripción (opcional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Corrección de metodología sección 3"
                className="form-input text-sm"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleUpload}
                disabled={!newFile || uploading}
                className="btn-primary btn-sm flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploading
                  ? <><Loader2 size={14} className="animate-spin" /> Subiendo...</>
                  : <><Upload size={14} /> Subir y marcar como oficial</>}
              </button>
              <button
                onClick={() => { setShowUploadForm(false); setNewFile(null); setNotes(''); }}
                className="btn-secondary btn-sm px-3"
                disabled={uploading}
              >
                Cancelar
              </button>
            </div>

            <p className="text-[11px] text-amber-600 flex items-center gap-1.5 bg-amber-50 rounded-lg px-3 py-2">
              <FileWarning size={13} className="flex-shrink-0" />
              La nueva versión quedará marcada automáticamente como documento oficial para este tipo de producto.
            </p>
          </div>
        )}

        {/* Lista de versiones */}
        {files.length === 0 ? (
          <div className="text-center py-4 text-gray-400">
            <FileText size={24} className="mx-auto mb-1 text-gray-200" />
            <p className="text-xs">Sin versiones registradas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => {
              const typeInfo      = FILE_TYPE_LABELS[file.fileType] ?? { label: file.fileType, color: 'bg-gray-100 text-gray-600' };
              const isDownloading = downloading === file.id;
              const isActivating  = activating  === file.id;

              return (
                <div
                  key={file.id}
                  className={`rounded-xl border p-3 transition-all ${
                    file.isActive
                      ? 'border-primary-300 bg-primary-50/40 shadow-sm'
                      : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                      file.isActive ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      v{file.version}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-800 truncate max-w-[200px]" title={file.fileName}>
                          {file.fileName}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        {file.isActive && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">
                            <Star size={9} fill="currentColor" /> Oficial
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {formatDate(file.createdAt, 'dd MMM yyyy HH:mm')}
                        </span>
                        {file.fileSize && <span>{formatFileSize(file.fileSize)}</span>}
                        {file.uploadedBy && (
                          <span>por {file.uploadedBy.firstName} {file.uploadedBy.lastName}</span>
                        )}
                      </div>

                      {file.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">{file.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleDownload(file.id, file.fileName)}
                        disabled={isDownloading}
                        title="Descargar esta versión"
                        className="w-7 h-7 rounded-lg bg-white border border-gray-200 hover:border-primary-300 hover:bg-primary-50 flex items-center justify-center transition-colors"
                      >
                        {isDownloading
                          ? <Loader2 size={13} className="animate-spin text-primary-500" />
                          : <Download size={13} className="text-gray-500" />}
                      </button>

                      {!file.isActive && (
                        <button
                          onClick={() => handleActivate(file.id, file.version)}
                          disabled={!!activating}
                          title="Marcar como versión oficial"
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 hover:border-green-400 hover:bg-green-50 flex items-center justify-center transition-colors"
                        >
                          {isActivating
                            ? <Loader2 size={13} className="animate-spin text-green-500" />
                            : <CheckCircle2 size={13} className="text-gray-400 hover:text-green-500" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function FileHistoryPanel({ submissionId, files, currentFileName, productTypes }: Props) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(true);

  const onRefresh = () => qc.invalidateQueries({ queryKey: ['submission', submissionId] });

  // Construir lista de grupos: uno por tipo de producto seleccionado
  // + uno "Sin tipo" para archivos legacy sin productTypeId
  const legacyFiles = files.filter(f => !f.productTypeId);

  // Si hay tipos de producto definidos, mostramos un panel por cada uno
  const groups: Array<{
    ptId: string | null;
    ptName: string;
    allowedFormats?: string;
    files: SubmissionFile[];
  }> = [];

  if (productTypes && productTypes.length > 0) {
    for (const pt of productTypes) {
      groups.push({
        ptId:           pt.id,
        ptName:         pt.name,
        allowedFormats: pt.allowedFileFormats,
        files:          files
          .filter(f => f.productTypeId === pt.id)
          .sort((a, b) => b.version - a.version),
      });
    }
    // Archivos legacy (sin productTypeId) van en un grupo aparte si los hay
    if (legacyFiles.length > 0) {
      groups.push({
        ptId:   null,
        ptName: 'Documentos anteriores',
        files:  legacyFiles.sort((a, b) => b.version - a.version),
      });
    }
  } else {
    // Sin tipos de producto: comportamiento legacy — un solo panel
    groups.push({
      ptId:   null,
      ptName: 'Historial de versiones',
      files:  [...files].sort((a, b) => b.version - a.version),
    });
  }

  const totalFiles = files.length;

  return (
    <div className="card">
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
            <FileText size={16} className="text-primary-600" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-gray-800 text-sm">
              Historial de Versiones
            </h3>
            <p className="text-xs text-gray-400">
              {totalFiles} versión{totalFiles !== 1 ? 'es' : ''} · oficial: {currentFileName || '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
            {totalFiles} docs
          </span>
          {expanded
            ? <ChevronUp size={16} className="text-gray-400" />
            : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3">
          {groups.map((g, i) => (
            <ProductTypePanel
              key={g.ptId ?? `legacy-${i}`}
              submissionId={submissionId}
              ptId={g.ptId}
              ptName={g.ptName}
              allowedFormats={g.allowedFormats}
              files={g.files}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
