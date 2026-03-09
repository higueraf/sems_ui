import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Mail, Send, ExternalLink, Upload, Trash2, Image,
} from 'lucide-react';
import { submissionsApi } from '../../api/submissions.api';
import { usersApi } from '../../api/index';
import { useAuthStore } from '../../store/auth.store';
import { STATUS_CONFIG, formatDate, getFileUrl } from '../../utils';
import { SubmissionStatus } from '../../types';

const TRANSITIONS: Record<SubmissionStatus, SubmissionStatus[]> = {
  received: ['under_review', 'withdrawn'],
  under_review: ['approved', 'rejected', 'revision_requested', 'withdrawn'],
  revision_requested: ['under_review', 'rejected', 'withdrawn'],
  approved: ['scheduled', 'rejected'],
  rejected: ['under_review'],
  withdrawn: [],
  scheduled: ['approved'],
};

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const [statusNotes, setStatusNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [notifyApplicant, setNotifyApplicant] = useState(true);
  const [uploadingPhotoId, setUploadingPhotoId] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

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
      toast.success('Estado actualizado correctamente');
      qc.invalidateQueries({ queryKey: ['submission', id] });
      setStatusNotes('');
      setInternalNotes('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error al cambiar estado'),
  });

  const emailMutation = useMutation({
    mutationFn: () => submissionsApi.sendEmail(id!, { subject: emailSubject, body: emailBody }),
    onSuccess: () => {
      toast.success('Correo enviado correctamente');
      setShowEmailModal(false);
      setEmailSubject('');
      setEmailBody('');
    },
    onError: () => toast.error('Error al enviar correo'),
  });

  const assignMutation = useMutation({
    mutationFn: (evaluatorId: string) => submissionsApi.assignEvaluator(id!, evaluatorId),
    onSuccess: () => toast.success('Evaluador asignado'),
    onError: () => toast.error('Error al asignar evaluador'),
  });

  if (isLoading || !sub) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const cfg = STATUS_CONFIG[sub.status];
  const allowedNext = TRANSITIONS[sub.status] || [];
  const correspondingAuthor = sub.authors.find((a) => a.isCorresponding) || sub.authors[0];

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate(-1)} className="btn-outline btn-sm flex items-center gap-1 mt-1">
          <ArrowLeft size={16} />
          Volver
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
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Abstract */}
          <div className="card">
            <h3 className="font-heading font-semibold text-gray-800 mb-3">Resumen</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{sub.abstractEs}</p>
            {sub.keywordsEs && (
              <div className="mt-3 flex flex-wrap gap-2">
                {sub.keywordsEs.split(',').map((kw) => (
                  <span key={kw} className="badge bg-primary-50 text-primary-700 text-xs">
                    {kw.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Authors */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-semibold text-gray-800">Autores</h3>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                Fotos para agenda pública
              </span>
            </div>
            <div className="space-y-3">
              {sub.authors.map((author, i) => (
                <div key={author.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">

                  {/* Foto del autor con upload */}
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

                    {/* Botón subir foto */}
                    <label
                      htmlFor={`author-photo-${author.id}`}
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-600 hover:bg-primary-700
                        rounded-full flex items-center justify-center cursor-pointer shadow-md
                        transition-colors"
                      title="Subir foto del ponente"
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
                        } catch {
                          toast.error('Error al subir la foto');
                        } finally {
                          setUploadingPhotoId(null);
                          e.target.value = '';
                        }
                      }}
                    />

                    {/* Botón eliminar foto (si existe) */}
                    {author.photoUrl && (
                      <button
                        onClick={async () => {
                          if (!confirm('¿Eliminar foto del autor?')) return;
                          try {
                            await submissionsApi.removeAuthorPhoto(author.id);
                            qc.invalidateQueries({ queryKey: ['submission', id] });
                            toast.success('Foto eliminada');
                          } catch {
                            toast.error('Error al eliminar foto');
                          }
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600
                          rounded-full flex items-center justify-center shadow transition-colors"
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
                          <Image size={9} /> Foto lista
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                      {author.academicTitle && <p>{author.academicTitle}</p>}
                      {author.affiliation && <p>{author.affiliation}</p>}
                      <p>{author.email}</p>
                      {author.orcid && <p>ORCID: {author.orcid}</p>}
                    </div>
                    {!author.photoUrl && (
                      <p className="text-[10px] text-amber-500 mt-1.5 flex items-center gap-1">
                        <Image size={9} /> Sin foto — requerida para la agenda pública
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content Sections */}
          {[
            { label: 'Introducción', value: sub.introduction },
            { label: 'Metodología', value: sub.methodology },
            { label: 'Resultados', value: sub.results },
            { label: 'Discusión', value: sub.discussion },
            { label: 'Conclusiones', value: sub.conclusions },
            { label: 'Bibliografía', value: sub.bibliography },
          ].filter((s) => s.value).map((section) => (
            <div key={section.label} className="card">
              <h3 className="font-heading font-semibold text-gray-800 mb-2">{section.label}</h3>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{section.value}</p>
            </div>
          ))}

          {/* Status History */}
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

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Details */}
          <div className="card">
            <h3 className="font-heading font-semibold text-gray-800 mb-3">Detalles</h3>
            <dl className="space-y-2 text-sm">
              {[
                { label: 'Eje Temático', value: sub.thematicAxis?.name },
                { label: 'Tipo', value: sub.productType?.name },
                { label: 'País', value: sub.country ? `${sub.country.flagEmoji} ${sub.country.name}` : '—' },
                { label: 'Páginas', value: sub.pageCount ? `${sub.pageCount}` : '—' },
                { label: 'Usa IA', value: sub.usesAi ? 'Sí' : 'No' },
                { label: 'Enviado', value: formatDate(sub.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-800 text-right">{value || '—'}</dd>
                </div>
              ))}
            </dl>
            {sub.fileUrl && (
              <a
                href={getFileUrl(sub.fileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline btn-sm flex items-center gap-1 mt-4 w-full justify-center"
                download={sub.fileName || true}
              >
                <ExternalLink size={14} />
                Descargar Archivo ({sub.fileName || 'documento'})
              </a>
            )}
          </div>

          {/* Change Status */}
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

          {/* Assign Evaluator */}
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
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Email */}
          {user?.role === 'admin' && (
            <div className="card">
              <h3 className="font-heading font-semibold text-gray-800 mb-3">Correo Personalizado</h3>
              <p className="text-xs text-gray-500 mb-3">
                Enviar a: {correspondingAuthor?.email}
              </p>
              <button
                onClick={() => setShowEmailModal(true)}
                className="btn-outline btn-sm flex items-center gap-2 w-full justify-center"
              >
                <Mail size={14} />
                Redactar Correo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-heading font-bold text-lg">Enviar Correo Personalizado</h3>
              <p className="text-sm text-gray-500 mt-1">Para: {correspondingAuthor?.fullName} ({correspondingAuthor?.email})</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="form-label">Asunto</label>
                <input className="form-input" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Asunto del correo..." />
              </div>
              <div>
                <label className="form-label">Mensaje (HTML permitido)</label>
                <textarea rows={8} className="form-input resize-none" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="<p>Mensaje...</p>" />
              </div>
            </div>
            <div className="p-6 pt-0 flex gap-3 justify-end">
              <button onClick={() => setShowEmailModal(false)} className="btn-outline btn-sm">
                Cancelar
              </button>
              <button
                onClick={() => emailMutation.mutate()}
                disabled={!emailSubject || !emailBody || emailMutation.isPending}
                className="btn-primary btn-sm flex items-center gap-2"
              >
                <Send size={14} />
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
