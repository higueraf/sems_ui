import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Mail, Download, Upload, Trash2, Image,
  Loader2, FileText, ShieldCheck, Eye, RefreshCw,
} from 'lucide-react';
import { submissionsApi } from '../../api/submissions.api';
import { usersApi } from '../../api/index';
import { useAuthStore } from '../../store/auth.store';
import { STATUS_CONFIG, formatDate, getFileUrl } from '../../utils';
import { SubmissionStatus } from '../../types';
import CustomEmailModal from '../../components/ui/CustomEmailModal';
import FileHistoryPanel from '../../components/ui/FileHistoryPanel';

const TRANSITIONS: Record<SubmissionStatus, SubmissionStatus[]> = {
  received:           ['under_review', 'withdrawn'],
  under_review:       ['approved', 'rejected', 'revision_requested', 'withdrawn'],
  revision_requested: ['under_review', 'rejected', 'withdrawn'],
  approved:           ['scheduled', 'rejected'],
  rejected:           ['under_review'],
  withdrawn:          [],
  scheduled:          ['approved'],
};

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const [statusNotes,       setStatusNotes]       = useState('');
  const [internalNotes,     setInternalNotes]      = useState('');
  const [showEmailModal,    setShowEmailModal]     = useState(false);
  const [notifyApplicant,   setNotifyApplicant]    = useState(true);
  const [uploadingPhotoId,  setUploadingPhotoId]   = useState<string | null>(null);
  const [downloadingFile,   setDownloadingFile]    = useState(false);
  const [uploadingIdDocId,  setUploadingIdDocId]   = useState<string | null>(null);
  const [downloadingIdDocId, setDownloadingIdDocId] = useState<string | null>(null);

  const idDocInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

  const statusMutation = useMutation({
    mutationFn: (newStatus: SubmissionStatus) =>
      submissionsApi.changeStatus(id!, { newStatus, notes: statusNotes, internalNotes, notifyApplicant }),
    onSuccess: () => {
      toast.success('Estado actualizado');
      qc.invalidateQueries({ queryKey: ['submission', id] });
      setStatusNotes('');
      setInternalNotes('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error al cambiar estado'),
  });

  const assignMutation = useMutation({
    mutationFn: (evaluatorId: string) => submissionsApi.assignEvaluator(id!, evaluatorId),
    onSuccess: () => toast.success('Evaluador asignado'),
    onError:   () => toast.error('Error al asignar evaluador'),
  });

  if (isLoading || !sub) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const cfg              = STATUS_CONFIG[sub.status];
  const allowedNext      = TRANSITIONS[sub.status] || [];
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
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-600 hover:bg-primary-700 rounded-full flex items-center justify-center cursor-pointer shadow-md transition-colors"
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
                                if (url) { window.open(url, '_blank'); }
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

          {/* Historial de versiones del documento */}
          <FileHistoryPanel
            submissionId={sub.id}
            files={sub.files ?? []}
            currentFileName={sub.fileName}
          />

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

          {/* Historial de estado */}
          <div className="card">
            <h3 className="font-heading font-semibold text-gray-800 mb-3">Historial de Estado</h3>
            <div className="space-y-3">
              {(sub.statusHistory || []).map((h) => (
                <div key={h.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary-400 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`badge ${STATUS_CONFIG[h.newStatus]?.bgColor} ${STATUS_CONFIG[h.newStatus]?.textColor} text-xs`}>
                        {STATUS_CONFIG[h.newStatus]?.label || h.newStatus}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(h.createdAt, 'dd MMM yyyy HH:mm')}</span>
                      {h.changedBy && <span className="text-xs text-gray-400">por {h.changedBy.firstName}</span>}
                    </div>
                    {h.notes && <p className="text-xs text-gray-600 mt-1">{h.notes}</p>}
                    {h.internalNotes && (
                      <p className="text-xs text-yellow-600 mt-1 bg-yellow-50 px-2 py-1 rounded">
                        Nota interna: {h.internalNotes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
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

            {/* Descarga del documento oficial */}
            {sub.fileUrl && (
              <button
                onClick={async () => {
                  setDownloadingFile(true);
                  try {
                    const { url, fileName } = await submissionsApi.getDownloadUrl(sub.id);
                    const a = document.createElement('a');
                    a.href = url;
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                    a.download = fileName || 'manuscrito';
                    a.click();
                  } catch { toast.error('No se pudo obtener el enlace de descarga'); }
                  finally   { setDownloadingFile(false); }
                }}
                disabled={downloadingFile}
                className="btn-outline btn-sm flex items-center gap-1 mt-4 w-full justify-center"
              >
                {downloadingFile
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Download size={14} />}
                <span className="truncate max-w-[160px]" title={sub.fileName}>
                  {downloadingFile ? 'Generando enlace...' : `Descargar Oficial (${sub.fileName || 'doc'})`}
                </span>
              </button>
            )}

            {/* Resumen de versiones */}
            {sub.files && sub.files.length > 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                <FileText size={12} className="text-primary-400" />
                <span>
                  {sub.files.length} versión{sub.files.length !== 1 ? 'es' : ''} · oficial: v{sub.files.find(f => f.isActive)?.version ?? '—'}
                </span>
              </div>
            )}
          </div>

          {/* Cambiar estado */}
          {allowedNext.length > 0 && (
            <div className="card">
              <h3 className="font-heading font-semibold text-gray-800 mb-3">Cambiar Estado</h3>
              <textarea
                placeholder="Observaciones (visibles al postulante)..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                rows={3}
                className="form-input text-sm resize-none mb-2"
              />
              <textarea
                placeholder="Notas internas (solo staff)..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={2}
                className="form-input text-sm resize-none mb-3"
              />
              <label className="flex items-center gap-2 text-sm text-gray-600 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyApplicant}
                  onChange={(e) => setNotifyApplicant(e.target.checked)}
                  className="w-4 h-4 accent-primary-500"
                />
                Notificar al postulante por correo
              </label>
              <div className="space-y-2">
                {allowedNext.map((nextStatus) => {
                  const nextCfg = STATUS_CONFIG[nextStatus];
                  return (
                    <button
                      key={nextStatus}
                      onClick={() => statusMutation.mutate(nextStatus)}
                      disabled={statusMutation.isPending}
                      className={`w-full py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${nextCfg?.bgColor} ${nextCfg?.textColor} hover:opacity-80`}
                    >
                      → {nextCfg?.label || nextStatus}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
