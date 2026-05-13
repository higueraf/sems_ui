import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Mail, Download, Upload, Trash2, Image,
  Loader2, FileText, ShieldCheck, Eye, RefreshCw, Award, Send,
  Star, Plus, CheckCircle2, Package,
} from 'lucide-react';
import { submissionsApi } from '../../api/submissions.api';
import { certificatesApi } from '../../api/certificates.api';
import { usersApi, productTypesApi } from '../../api/index';
import api from '../../api/axios';
import { useAuthStore } from '../../store/auth.store';
import { STATUS_CONFIG, formatDate, getFileUrl } from '../../utils';
import { SubmissionStatus, ScientificProductType } from '../../types';
import CustomEmailModal from '../../components/ui/CustomEmailModal';

// ── Document helpers ──────────────────────────────────────────────────────────
function formatFileSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
function getAcceptForFormats(formats?: string): string {
  if (!formats) return '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const fmts = formats.split(',').map(f => f.trim().toLowerCase());
  const parts: string[] = [];
  if (fmts.includes('docx') || fmts.includes('doc'))
    parts.push('.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  if (fmts.includes('pptx') || fmts.includes('ppt'))
    parts.push('.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation');
  if (fmts.includes('pdf')) parts.push('.pdf,application/pdf');
  return parts.join(',') || '.doc,.docx';
}
function getFormatLabel(formats?: string): string {
  if (!formats) return '.docx — máx 20 MB';
  const fmts = formats.split(',').map(f => f.trim().toLowerCase());
  const labels: string[] = [];
  if (fmts.includes('docx') || fmts.includes('doc')) labels.push('.docx');
  if (fmts.includes('pptx') || fmts.includes('ppt')) labels.push('.pptx');
  if (fmts.includes('pdf')) labels.push('.pdf');
  return (labels.join(' / ') || '.docx') + ' — máx 20 MB';
}
const FILE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  manuscript:  { label: 'Inicial',    color: 'bg-blue-100 text-blue-700' },
  correction:  { label: 'Corrección', color: 'bg-amber-100 text-amber-700' },
  final:       { label: 'Final',      color: 'bg-green-100 text-green-700' },
};

const TRANSITIONS: Record<SubmissionStatus, SubmissionStatus[]> = {
  received:           ['under_review', 'withdrawn'],
  under_review:       ['approved', 'rejected', 'revision_requested', 'withdrawn'],
  revision_requested: ['under_review', 'rejected', 'withdrawn'],
  approved:           ['scheduled', 'rejected'],
  rejected:           ['under_review'],
  withdrawn:          [],
  scheduled:          ['approved', 'executed'],
  executed:           ['certificate_sent', 'scheduled'],
  certificate_sent:   ['executed'],
};

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const [showEmailModal,    setShowEmailModal]     = useState(false);
  const [uploadingPhotoId,  setUploadingPhotoId]   = useState<string | null>(null);
  const [uploadingIdDocId,  setUploadingIdDocId]   = useState<string | null>(null);
  const [downloadingIdDocId, setDownloadingIdDocId] = useState<string | null>(null);
  const [ptNotes,           setPtNotes]            = useState<Record<string, string>>({});
  const [ptNotify,          setPtNotify]           = useState<Record<string, boolean>>({});
  const [generatingCert,    setGeneratingCert]     = useState<string | null>(null);
  // Document upload/activate
  const [docUploadPtId,     setDocUploadPtId]      = useState<string | null>(null);
  const [docUploadFile,     setDocUploadFile]      = useState<File | null>(null);
  const [docUploadNotes,    setDocUploadNotes]     = useState('');
  const [docUploadFileType, setDocUploadFileType]  = useState<'correction' | 'final'>('correction');
  const [docUploading,      setDocUploading]       = useState(false);
  const [docActivating,     setDocActivating]      = useState<string | null>(null);
  const [docDownloading,    setDocDownloading]     = useState<string | null>(null);

  const idDocInputRefs   = useRef<Record<string, HTMLInputElement | null>>({});
  const docFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { data: sub, isLoading } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => submissionsApi.getOne(id!),
    enabled: !!id,
  });

  const { data: users } = useQuery({
    queryKey: ['users-admin'],
    queryFn: usersApi.getAll,
    enabled: user?.role === 'admin',
  });

  const { data: allProductTypes } = useQuery({
    queryKey: ['product-types'],
    queryFn: () => productTypesApi.getAll(true),
  });

  const assignMutation = useMutation({
    mutationFn: (evaluatorId: string) => submissionsApi.assignEvaluator(id!, evaluatorId),
    onSuccess: () => toast.success('Evaluador asignado'),
    onError:   () => toast.error('Error al asignar evaluador'),
  });

  const ptStatusMutation = useMutation({
    mutationFn: ({ productTypeId, newStatus }: { productTypeId: string; newStatus: SubmissionStatus }) =>
      api.patch(`/submissions/admin/${id}/product-type-status`, {
        productTypeId, newStatus,
        notes: ptNotes[productTypeId] || undefined,
        notifyApplicant: ptNotify[productTypeId] ?? true,
      }).then(r => r.data),
    onSuccess: () => {
      toast.success('Estatus por tipo de producto actualizado');
      qc.invalidateQueries({ queryKey: ['submission', id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error al cambiar estatus'),
  });

  const handleDocDownload = async (fileId: string, fileName: string) => {
    setDocDownloading(fileId);
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
    } catch { toast.error('No se pudo generar el enlace de descarga'); }
    finally { setDocDownloading(null); }
  };

  const handleDocActivate = async (fileId: string, version: number, ptName: string) => {
    if (!confirm(`¿Establecer la versión ${version} de "${ptName}" como documento oficial?`)) return;
    setDocActivating(fileId);
    try {
      await submissionsApi.setActiveFileVersion(id!, fileId);
      toast.success(`Versión ${version} establecida como oficial`);
      qc.invalidateQueries({ queryKey: ['submission', id] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al activar');
    } finally { setDocActivating(null); }
  };

  const handleDocUpload = async (ptId: string) => {
    if (!docUploadFile) { toast.error('Seleccione un archivo'); return; }
    setDocUploading(true);
    try {
      await submissionsApi.addFileVersion(id!, docUploadFile, docUploadFileType, docUploadNotes || undefined, ptId);
      toast.success('Nueva versión subida y marcada como oficial');
      qc.invalidateQueries({ queryKey: ['submission', id] });
      setDocUploadPtId(null); setDocUploadFile(null); setDocUploadNotes('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al subir el archivo');
    } finally { setDocUploading(false); }
  };

  if (isLoading || !sub) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const cfg              = STATUS_CONFIG[sub.status];
  const correspondingAuthor = sub.authors.find((a) => a.isCorresponding) || sub.authors[0];

  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate(-1)} className="btn-outline btn-sm flex items-center gap-1 mt-1">
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-sm text-primary-600 font-semibold">{sub.referenceCode}</span>
            <span className={`badge ${cfg?.bgColor} ${cfg?.textColor}`}>{cfg?.label}</span>
          </div>
          <h1 className="font-heading font-bold text-xl text-gray-900">{sub.titleEs}</h1>
          {sub.titleEn && <p className="text-gray-500 text-sm italic">{sub.titleEn}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Columna principal ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Resumen */}
          <div className="card">
            <h3 className="font-heading font-semibold text-gray-800 mb-3">Resumen</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{sub.abstractEs}</p>
            {sub.keywordsEs && (
              <div className="mt-3 flex flex-wrap gap-2">
                {sub.keywordsEs.split(',').map((kw) => (
                  <span key={kw} className="badge bg-primary-50 text-primary-700 text-xs">{kw.trim()}</span>
                ))}
              </div>
            )}
          </div>

          {/* Autores */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-gray-800">Autores</h3>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                Fotos para agenda · Docs. identidad
              </span>
            </div>

            <div className="space-y-4">
              {sub.authors.map((author, i) => (
                <div key={author.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">

                  {/* Avatar + upload foto */}
                  <div className="relative flex-shrink-0">
                    {author.photoUrl ? (
                      <img
                        src={getFileUrl(author.photoUrl)}
                        alt={author.fullName}
                        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-500 flex items-center justify-center font-bold text-lg border-2 border-white shadow-sm">
                        {i + 1}
                      </div>
                    )}
                    <label
                      htmlFor={`author-photo-${author.id}`}
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md transition-colors"
                      title="Subir/cambiar foto"
                    >
                      {uploadingPhotoId === author.id
                        ? <span className="w-3 h-3 border-2 border-white rounded-full animate-spin border-t-transparent" />
                        : <Upload size={11} className="text-white" />}
                    </label>
                    <input
                      id={`author-photo-${author.id}`}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={!!uploadingPhotoId}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingPhotoId(author.id);
                        try {
                          await submissionsApi.uploadAuthorPhoto(author.id, file);
                          qc.invalidateQueries({ queryKey: ['submission', id] });
                          toast.success(`Foto de ${author.fullName} actualizada`);
                        } catch { toast.error('Error al subir la foto'); }
                        finally { setUploadingPhotoId(null); e.target.value = ''; }
                      }}
                    />
                    {author.photoUrl && (
                      <button
                        onClick={async () => {
                          if (!confirm('¿Eliminar foto?')) return;
                          try {
                            await submissionsApi.removeAuthorPhoto(author.id);
                            qc.invalidateQueries({ queryKey: ['submission', id] });
                            toast.success('Foto eliminada');
                          } catch { toast.error('Error al eliminar foto'); }
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow transition-colors"
                        title="Eliminar foto"
                      >
                        <Trash2 size={9} className="text-white" />
                      </button>
                    )}
                  </div>

                  {/* Datos del autor */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">{author.fullName}</span>
                      {author.country && <span>{author.country.flagEmoji}</span>}
                      {author.isCorresponding && (
                        <span className="badge bg-primary-100 text-primary-700 text-xs">Correspondencia</span>
                      )}
                      {author.photoUrl && (
                        <span className="badge bg-green-100 text-green-700 text-xs flex items-center gap-1">
                          <Image size={9} /> Foto
                        </span>
                      )}
                      {author.identityDocUrl && (
                        <span className="badge bg-blue-100 text-blue-700 text-xs flex items-center gap-1">
                          <ShieldCheck size={9} /> ID
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                      {author.academicTitle && <p>{author.academicTitle}</p>}
                      {author.affiliation   && <p>{author.affiliation}</p>}
                      <p>{author.email}</p>
                      {author.orcid && <p>ORCID: {author.orcid}</p>}
                      {author.identityDocType && (
                        <p className="text-blue-600">
                          {author.identityDocType}{author.identityDocNumber ? `: ${author.identityDocNumber}` : ''}
                        </p>
                      )}
                    </div>

                    {/* Acciones doc. de identidad */}
                    <div className="flex items-center gap-2 mt-2">
                      {author.identityDocUrl ? (
                        <>
                          {/* Ver/descargar */}
                          <button
                            disabled={downloadingIdDocId === author.id}
                            onClick={async () => {
                              setDownloadingIdDocId(author.id);
                              try {
                                const { url } = await submissionsApi.getAuthorIdDocUrl(author.id);
                                if (url) {
                                  if (url.includes('/api/local-files/private/')) {
                                    const response = await api.get(url, { responseType: 'blob' });
                                    const blob = new Blob([response.data], { type: 'application/pdf' });
                                    const blobUrl = window.URL.createObjectURL(blob);
                                    window.open(blobUrl, '_blank');
                                    // No revocamos inmediatamente para permitir que se abra la pestaña
                                    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
                                  } else {
                                    window.open(url, '_blank');
                                  }
                                }
                                else     { toast.error('Sin documento de identidad'); }
                              } catch { toast.error('Error al obtener el documento'); }
                              finally   { setDownloadingIdDocId(null); }
                            }}
                            className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 rounded-lg px-2 py-1 transition-colors"
                          >
                            {downloadingIdDocId === author.id
                              ? <Loader2 size={10} className="animate-spin" />
                              : <Eye size={10} />}
                            Ver ID
                          </button>

                          {/* Reemplazar */}
                          {user?.role === 'admin' && (
                            <label
                              htmlFor={`id-doc-${author.id}`}
                              className="flex items-center gap-1 text-[11px] text-amber-600 hover:text-amber-800 font-medium bg-amber-50 hover:bg-amber-100 rounded-lg px-2 py-1 cursor-pointer transition-colors"
                              title="Reemplazar documento de identidad"
                            >
                              {uploadingIdDocId === author.id
                                ? <Loader2 size={10} className="animate-spin" />
                                : <RefreshCw size={10} />}
                              Reemplazar
                            </label>
                          )}
                        </>
                      ) : (
                        user?.role === 'admin' && (
                          <label
                            htmlFor={`id-doc-${author.id}`}
                            className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700 font-medium bg-gray-100 hover:bg-gray-200 rounded-lg px-2 py-1 cursor-pointer transition-colors"
                          >
                            {uploadingIdDocId === author.id
                              ? <Loader2 size={10} className="animate-spin" />
                              : <Upload size={10} />}
                            Subir ID PDF
                          </label>
                        )
                      )}

                      {/* Input oculto para doc. identidad */}
                      {user?.role === 'admin' && (
                        <input
                          id={`id-doc-${author.id}`}
                          ref={(el) => { idDocInputRefs.current[author.id] = el; }}
                          type="file"
                          accept=".pdf,application/pdf"
                          className="hidden"
                          disabled={!!uploadingIdDocId}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingIdDocId(author.id);
                            try {
                              await submissionsApi.replaceAuthorIdDoc(author.id, file);
                              qc.invalidateQueries({ queryKey: ['submission', id] });
                              toast.success(`Documento de ${author.fullName} actualizado`);
                            } catch (err: any) {
                              toast.error(err?.response?.data?.message || 'Error al subir el documento');
                            } finally {
                              setUploadingIdDocId(null);
                              e.target.value = '';
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Secciones de contenido */}
          {[
            { label: 'Introducción', value: sub.introduction },
            { label: 'Metodología',  value: sub.methodology },
            { label: 'Resultados',   value: sub.results },
            { label: 'Discusión',    value: sub.discussion },
            { label: 'Conclusiones', value: sub.conclusions },
            { label: 'Bibliografía', value: sub.bibliography },
          ].filter((s) => s.value).map((section) => (
            <div key={section.label} className="card">
              <h3 className="font-heading font-semibold text-gray-800 mb-2">{section.label}</h3>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{section.value}</p>
            </div>
          ))}

        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Detalles */}
          <div className="card">
            <h3 className="font-heading font-semibold text-gray-800 mb-3">Detalles</h3>
            <dl className="space-y-2 text-sm">
              {[
                { label: 'Eje Temático', value: sub.thematicAxis?.name },
                { label: 'Tipo',         value: sub.productType?.name },
                { label: 'País',         value: sub.country ? `${sub.country.flagEmoji} ${sub.country.name}` : '—' },
                { label: 'Páginas',      value: sub.pageCount ? `${sub.pageCount}` : '—' },
                { label: 'Usa IA',       value: sub.usesAi ? 'Sí' : 'No' },
                { label: 'Enviado',      value: formatDate(sub.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-800 text-right">{value || '—'}</dd>
                </div>
              ))}
            </dl>

          </div>

          {/* Asignar evaluador */}
          {user?.role === 'admin' && users && (
            <div className="card">
              <h3 className="font-heading font-semibold text-gray-800 mb-3">Asignar Evaluador</h3>
              <select
                className="form-input text-sm"
                value={sub.assignedEvaluatorId || ''}
                onChange={(e) => e.target.value && assignMutation.mutate(e.target.value)}
              >
                <option value="">Sin asignar</option>
                {users.filter((u) => u.role === 'evaluator').map((u) => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Correo personalizado */}
          {user?.role === 'admin' && (
            <div className="card">
              <h3 className="font-heading font-semibold text-gray-800 mb-3">Correo Personalizado</h3>
              <p className="text-xs text-gray-500 mb-3">
                Para: {correspondingAuthor?.email}
              </p>
              <button
                onClick={() => setShowEmailModal(true)}
                className="btn-outline btn-sm flex items-center gap-2 w-full justify-center"
              >
                <Mail size={14} /> Redactar correo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Tipo de Producción Científica ─────────────────────────────────── */}
      {(() => {
        const allIds = sub.productTypeIds && sub.productTypeIds.length > 0
          ? sub.productTypeIds
          : (sub.productType?.id ? [sub.productType.id] : []);
        if (allIds.length === 0) return null;
        const statuses = sub.productStatuses ?? {};
        const ptMap: Record<string, ScientificProductType> = {};
        if (allProductTypes) for (const pt of allProductTypes) ptMap[pt.id] = pt;

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-primary-600" />
              <h2 className="font-heading font-semibold text-gray-800 text-lg">Tipo de Producción Científica</h2>
            </div>

            {allIds.map((ptId) => {
              const pt            = ptMap[ptId] ?? { id: ptId, name: sub.productType?.name ?? ptId } as ScientificProductType;
              const currentStatus = (statuses[ptId] ?? 'received') as SubmissionStatus;
              const cfg2          = STATUS_CONFIG[currentStatus];
              const allowed2      = (TRANSITIONS[currentStatus] ?? []).filter(s => s !== 'certificate_sent');
              const isExecuted    = currentStatus === 'executed';
              const isSent        = currentStatus === 'certificate_sent';
              const ptHistory     = (sub.statusHistory ?? []).filter(h => h.productTypeId === ptId);
              const ptFiles       = (sub.files ?? []).filter(f => f.productTypeId === ptId).sort((a, b) => b.version - a.version);
              const ptActiveFile  = ptFiles.find(f => f.isActive);

              return (
                <div key={ptId} className="card">
                  {/* ── Encabezado ───────────────────────────────────────────── */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Package size={15} className="text-primary-500 flex-shrink-0" />
                      <h3 className="font-heading font-semibold text-gray-800">{pt.name}</h3>
                    </div>
                    <span className={`badge ${cfg2?.bgColor} ${cfg2?.textColor}`}>
                      {cfg2?.label ?? currentStatus}
                    </span>
                  </div>

                  {/* Banner certificados */}
                  {(isExecuted || isSent) && (
                    <div className={`flex items-center gap-2 mb-4 text-xs rounded-lg px-3 py-2 ${isSent ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      <Award size={14} />
                      {isSent ? 'Certificados enviados a todos los autores' : 'Listo para generar certificados'}
                    </div>
                  )}

                  {/* Botón generar certificados */}
                  {user?.role === 'admin' && isExecuted && (
                    <button
                      onClick={async () => {
                        setGeneratingCert(ptId);
                        try {
                          const result = await certificatesApi.generateAndSend(id!, ptId);
                          toast.success(`${result.generated} certificado(s) generados · ${result.sent} enviados`);
                          qc.invalidateQueries({ queryKey: ['submission', id] });
                        } catch (err: any) {
                          toast.error(err.response?.data?.message || 'Error generando certificados');
                        } finally { setGeneratingCert(null); }
                      }}
                      disabled={generatingCert === ptId}
                      className="mb-4 mx-auto flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white text-sm font-semibold py-2 px-6 rounded-lg transition-colors"
                    >
                      {generatingCert === ptId
                        ? <><Loader2 size={14} className="animate-spin" /> Generando...</>
                        : <><Send size={14} /> Generar y Enviar Certificados</>}
                    </button>
                  )}

                  {/* ── Grid 2 × 2 ──────────────────────────────────────────── */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-t border-gray-100 pt-4">

                    {/* ── Columna izquierda ─────────────────────────────────── */}
                    <div className="space-y-5 lg:pr-5 lg:border-r lg:border-gray-100">

                      {/* Cambiar estatus */}
                      <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Cambiar Estatus</p>
                        {allowed2.length > 0 ? (
                          <div className="space-y-2">
                            <textarea
                              placeholder="Notas del cambio de estatus (opcional)..."
                              value={ptNotes[ptId] ?? ''}
                              onChange={(e) => setPtNotes(prev => ({ ...prev, [ptId]: e.target.value }))}
                              rows={3}
                              className="form-input text-xs resize-none"
                            />
                            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={ptNotify[ptId] ?? true}
                                onChange={(e) => setPtNotify(prev => ({ ...prev, [ptId]: e.target.checked }))}
                                className="w-3.5 h-3.5 accent-primary-500"
                              />
                              Notificar al postulante por correo
                            </label>
                            <div className="space-y-1.5 pt-1">
                              {allowed2.map((nextStatus) => {
                                const nc = STATUS_CONFIG[nextStatus];
                                return (
                                  <button
                                    key={nextStatus}
                                    onClick={() => ptStatusMutation.mutate({ productTypeId: ptId, newStatus: nextStatus })}
                                    disabled={ptStatusMutation.isPending}
                                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${nc?.bgColor} ${nc?.textColor} hover:opacity-80`}
                                  >
                                    → {nc?.label ?? nextStatus}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">Sin transiciones disponibles en este estatus.</p>
                        )}
                      </div>

                      {/* Documento oficial */}
                      <div className="border-t border-gray-100 pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Documento Oficial</p>
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => {
                                if (docUploadPtId === ptId) { setDocUploadPtId(null); setDocUploadFile(null); setDocUploadNotes(''); }
                                else { setDocUploadPtId(ptId); setDocUploadFile(null); setDocUploadNotes(''); setDocUploadFileType('correction'); }
                              }}
                              className="flex items-center gap-1 text-[11px] text-primary-600 hover:text-primary-800 font-semibold border border-primary-200 rounded-lg px-2 py-1 hover:bg-primary-50 transition-colors"
                            >
                              <Plus size={11} /> Nueva versión
                            </button>
                          )}
                        </div>

                        {/* Formulario de subida */}
                        {docUploadPtId === ptId && (
                          <div className="border border-primary-200 bg-primary-50/30 rounded-xl p-3 space-y-2 mb-3">
                            <div
                              onClick={() => docFileInputRefs.current[ptId]?.click()}
                              className="border-2 border-dashed border-primary-300 rounded-lg p-3 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
                            >
                              {docUploadFile ? (
                                <div className="flex items-center justify-center gap-2 text-xs text-primary-700">
                                  <FileText size={14} className="text-primary-500 flex-shrink-0" />
                                  <span className="font-medium truncate max-w-[180px]">{docUploadFile.name}</span>
                                  <span className="text-gray-400 flex-shrink-0">({formatFileSize(docUploadFile.size)})</span>
                                </div>
                              ) : (
                                <div className="text-gray-400">
                                  <Upload size={18} className="mx-auto mb-1 text-gray-300" />
                                  <p className="text-xs">Clic para seleccionar</p>
                                  <p className="text-[10px] mt-0.5">{getFormatLabel(pt.allowedFileFormats)}</p>
                                </div>
                              )}
                            </div>
                            <input
                              ref={(el) => { docFileInputRefs.current[ptId] = el; }}
                              type="file"
                              accept={getAcceptForFormats(pt.allowedFileFormats)}
                              className="hidden"
                              onChange={(e) => { const f = e.target.files?.[0]; if (f) setDocUploadFile(f); e.target.value = ''; }}
                            />
                            <select
                              value={docUploadFileType}
                              onChange={(e) => setDocUploadFileType(e.target.value as 'correction' | 'final')}
                              className="form-input text-xs"
                            >
                              <option value="correction">Corrección — con cambios solicitados</option>
                              <option value="final">Final — versión definitiva</option>
                            </select>
                            <input
                              type="text"
                              value={docUploadNotes}
                              onChange={(e) => setDocUploadNotes(e.target.value)}
                              placeholder="Nota descriptiva (opcional)"
                              className="form-input text-xs"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDocUpload(ptId)}
                                disabled={!docUploadFile || docUploading}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors"
                              >
                                {docUploading ? <><Loader2 size={12} className="animate-spin" /> Subiendo...</> : <><Upload size={12} /> Subir y marcar oficial</>}
                              </button>
                              <button
                                onClick={() => { setDocUploadPtId(null); setDocUploadFile(null); setDocUploadNotes(''); }}
                                disabled={docUploading}
                                className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Archivo activo / oficial */}
                        {ptActiveFile ? (
                          <div className="flex items-center gap-3 p-3 bg-primary-50/50 border border-primary-200 rounded-xl">
                            <div className="w-9 h-9 rounded-lg bg-primary-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                              v{ptActiveFile.version}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <Star size={10} className="text-primary-500 flex-shrink-0" fill="currentColor" />
                                <span className="text-xs font-semibold text-gray-800 truncate">{ptActiveFile.fileName}</span>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {formatDate(ptActiveFile.createdAt, 'dd MMM yyyy')} · {formatFileSize(ptActiveFile.fileSize)}
                                {ptActiveFile.uploadedBy && ` · ${ptActiveFile.uploadedBy.firstName}`}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDocDownload(ptActiveFile.id, ptActiveFile.fileName)}
                              disabled={docDownloading === ptActiveFile.id}
                              className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:border-primary-300 hover:bg-primary-50 flex items-center justify-center transition-colors flex-shrink-0"
                              title="Descargar"
                            >
                              {docDownloading === ptActiveFile.id
                                ? <Loader2 size={13} className="animate-spin text-primary-500" />
                                : <Download size={13} className="text-gray-500" />}
                            </button>
                          </div>
                        ) : (
                          <div className="text-center py-5 text-gray-300">
                            <FileText size={22} className="mx-auto mb-1" />
                            <p className="text-xs text-gray-400">Sin documento oficial</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Columna derecha ───────────────────────────────────── */}
                    <div className="space-y-5 lg:pl-5 mt-5 lg:mt-0">

                      {/* Historial de estatus */}
                      <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Historial de Estatus</p>
                        {ptHistory.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">Sin historial registrado.</p>
                        ) : (
                          <div className="space-y-2 max-h-[36rem] overflow-y-auto pr-1">
                            {ptHistory.map((h) => (
                              <div key={h.id} className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-primary-400 rounded-full mt-1.5 flex-shrink-0" />
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`badge text-[10px] ${STATUS_CONFIG[h.newStatus]?.bgColor} ${STATUS_CONFIG[h.newStatus]?.textColor}`}>
                                      {STATUS_CONFIG[h.newStatus]?.label || h.newStatus}
                                    </span>
                                    <span className="text-[10px] text-gray-400">{formatDate(h.createdAt, 'dd MMM HH:mm')}</span>
                                    {h.changedBy && <span className="text-[10px] text-gray-400">por {h.changedBy.firstName}</span>}
                                    {h.notifiedApplicant && <span className="text-[10px] text-blue-400" title="Notificado">✉</span>}
                                  </div>
                                  {h.notes && <p className="text-[10px] text-gray-600 mt-0.5">{h.notes}</p>}
                                  {h.internalNotes && <p className="text-[10px] text-yellow-600 mt-0.5 bg-yellow-50 px-1.5 py-0.5 rounded">{h.internalNotes}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Versiones del documento */}
                      <div className="border-t border-gray-100 pt-4">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                          Versiones del Documento
                          {ptFiles.length > 0 && <span className="ml-1.5 text-primary-500">({ptFiles.length})</span>}
                        </p>
                        {ptFiles.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">Sin versiones registradas.</p>
                        ) : (
                          <div className="space-y-2 max-h-[36rem] overflow-y-auto pr-1">
                            {ptFiles.map((file) => {
                              const typeInfo = FILE_TYPE_LABELS[file.fileType] ?? { label: file.fileType, color: 'bg-gray-100 text-gray-600' };
                              return (
                                <div
                                  key={file.id}
                                  className={`rounded-xl border p-2.5 transition-all ${
                                    file.isActive
                                      ? 'border-primary-300 bg-primary-50/40 shadow-sm'
                                      : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                      file.isActive ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                      v{file.version}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-xs font-medium text-gray-800 truncate max-w-[160px]" title={file.fileName}>{file.fileName}</span>
                                        {file.isActive && <Star size={9} className="text-primary-500 flex-shrink-0" fill="currentColor" />}
                                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${typeInfo.color}`}>{typeInfo.label}</span>
                                      </div>
                                      <p className="text-[10px] text-gray-400 mt-0.5">
                                        {formatDate(file.createdAt, 'dd MMM HH:mm')} · {formatFileSize(file.fileSize)}
                                      </p>
                                      {file.notes && <p className="text-[10px] text-gray-500 italic mt-0.5">{file.notes}</p>}
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      <button
                                        onClick={() => handleDocDownload(file.id, file.fileName)}
                                        disabled={docDownloading === file.id}
                                        title="Descargar"
                                        className="w-6 h-6 rounded-lg bg-white border border-gray-200 hover:border-primary-300 hover:bg-primary-50 flex items-center justify-center transition-colors"
                                      >
                                        {docDownloading === file.id
                                          ? <Loader2 size={11} className="animate-spin text-primary-500" />
                                          : <Download size={11} className="text-gray-500" />}
                                      </button>
                                      {!file.isActive && user?.role === 'admin' && (
                                        <button
                                          onClick={() => handleDocActivate(file.id, file.version, pt.name)}
                                          disabled={!!docActivating}
                                          title="Marcar como oficial"
                                          className="w-6 h-6 rounded-lg bg-white border border-gray-200 hover:border-green-400 hover:bg-green-50 flex items-center justify-center transition-colors"
                                        >
                                          {docActivating === file.id
                                            ? <Loader2 size={11} className="animate-spin text-green-500" />
                                            : <CheckCircle2 size={11} className="text-gray-400" />}
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
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Modal de correo */}
      {showEmailModal && correspondingAuthor && (
        <CustomEmailModal
          toName={correspondingAuthor.fullName}
          toEmail={correspondingAuthor.email}
          title="Correo Personalizado"
          onClose={() => setShowEmailModal(false)}
          onSend={async (subject, body, attachment) => {
            if (attachment) {
              await submissionsApi.sendEmailWithAttachment(id!, subject, body, attachment);
            } else {
              await submissionsApi.sendEmail(id!, { subject, body });
            }
            toast.success('Correo enviado' + (attachment ? ' con adjunto' : ''));
          }}
        />
      )}
    </div>
  );
}
