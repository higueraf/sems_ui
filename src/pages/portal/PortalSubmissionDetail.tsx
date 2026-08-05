import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft, BookOpen, Upload, Download, Award,
  CheckCircle, Clock, AlertCircle, XCircle, LogOut,
} from 'lucide-react';
import { portalApi } from '../../api/portal.api';
import { eventsApi } from '../../api/events.api';
import { useAuthStore } from '../../store/auth.store';
import { STATUS_CONFIG, formatDate, formatEventDateRange } from '../../utils';

const STATUS_ICONS: Record<string, React.ReactNode> = {
  received:           <Clock size={14} className="text-blue-500" />,
  under_review:       <Clock size={14} className="text-yellow-500" />,
  revision_requested: <AlertCircle size={14} className="text-orange-500" />,
  approved:           <CheckCircle size={14} className="text-green-600" />,
  rejected:           <XCircle size={14} className="text-red-500" />,
  cancelled:          <XCircle size={14} className="text-gray-400" />,
  scheduled:          <CheckCircle size={14} className="text-green-600" />,
  executed:           <CheckCircle size={14} className="text-green-700" />,
  certificate_sent:   <Award size={14} className="text-primary-600" />,
};

export default function PortalSubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuthStore();
  const qc = useQueryClient();

  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: activeEvent } = useQuery({ queryKey: ['event-active'], queryFn: eventsApi.getActive });
  const eventName = activeEvent?.name || 'Simposio Internacional de Ciencia Abierta';
  const eventDateRange = formatEventDateRange(activeEvent?.startDate, activeEvent?.endDate);

  const { data: submission, isLoading } = useQuery({
    queryKey: ['portal-submission', id],
    queryFn: () => portalApi.getMySubmission(id!),
    enabled: !!id,
  });

  const { data: certs = [] } = useQuery({
    queryKey: ['portal-certs', id],
    queryFn: () => portalApi.getMyCertificates(id!),
    enabled: !!id,
  });

  const revisionMutation = useMutation({
    mutationFn: () => portalApi.uploadRevision(id!, revisionFile!, revisionNotes || undefined),
    onSuccess: () => {
      toast.success('Corrección enviada correctamente');
      setRevisionFile(null);
      setRevisionNotes('');
      qc.invalidateQueries({ queryKey: ['portal-submission', id] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al subir el archivo'),
  });

  const downloadCert = async (certId: string, format: 'diploma' | 'carta') => {
    try {
      const { url, fileName } = await portalApi.getCertDownloadUrl(certId, format);
      const a = document.createElement('a');
      a.href = url; a.download = fileName ?? 'certificado.pdf'; a.target = '_blank';
      document.body.appendChild(a); a.click(); a.remove();
    } catch {
      toast.error('No se pudo descargar el certificado');
    }
  };

  const hasRevisionRequested =
    submission?.status === 'revision_requested' ||
    Object.values(submission?.productStatuses ?? {}).some(s => s === 'revision_requested');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#007F3A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Postulación no encontrada.</p>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[submission.status as keyof typeof STATUS_CONFIG];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-[#003918] text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <BookOpen size={22} className="text-[#7ee8a2]" />
          <div>
            <div className="font-bold text-sm">Portal de Autores</div>
            <div className="text-[#a0d8b3] text-xs">{eventName}{eventDateRange ? ` ${eventDateRange.year}` : ''}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#a0d8b3]">{user?.firstName} {user?.lastName}</span>
          <button onClick={logout} className="flex items-center gap-1.5 text-xs text-[#a0d8b3] hover:text-white transition-colors">
            <LogOut size={14} /> Salir
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Link to="/portal" className="inline-flex items-center gap-1.5 text-sm text-[#007F3A] hover:underline mb-5">
          <ArrowLeft size={14} /> Mis postulaciones
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="font-mono text-xs text-gray-400 mb-1">{submission.referenceCode}</p>
              <h1 className="text-lg font-bold text-gray-800">{submission.titleEs}</h1>
            </div>
            {cfg && (
              <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${cfg.bgColor} ${cfg.textColor}`}>
                {cfg.label}
              </span>
            )}
          </div>
          {submission.event && (
            <p className="text-xs text-gray-400">{submission.event.name}</p>
          )}
        </div>

        {/* Timeline de estados */}
        {submission.statusHistory?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Historial de estados
            </h2>
            <ol className="relative border-l-2 border-gray-100 space-y-5 ml-2">
              {submission.statusHistory.map((h: any) => {
                const hCfg = STATUS_CONFIG[h.newStatus as keyof typeof STATUS_CONFIG];
                return (
                  <li key={h.id} className="ml-5">
                    <div className="absolute -left-[9px] w-4 h-4 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                      {STATUS_ICONS[h.newStatus] ?? <div className="w-2 h-2 rounded-full bg-gray-300" />}
                    </div>
                    <div className="flex items-center gap-2 mb-0.5">
                      {hCfg && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hCfg.bgColor} ${hCfg.textColor}`}>
                          {hCfg.label}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{formatDate(h.createdAt, 'dd MMM yyyy HH:mm')}</span>
                    </div>
                    {h.notes && (
                      <div className="mt-1 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                        {h.notes}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* Subir corrección */}
        {hasRevisionRequested && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-5">
            <h2 className="text-sm font-bold text-orange-800 mb-1">Revisión solicitada</h2>
            <p className="text-xs text-orange-700 mb-4">
              El comité ha solicitado correcciones a tu trabajo. Sube el archivo corregido a continuación.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".doc,.docx,.pdf,.ppt,.pptx"
              onChange={(e) => setRevisionFile(e.target.files?.[0] ?? null)}
            />

            {revisionFile ? (
              <div className="flex items-center gap-2 p-3 bg-white border border-orange-200 rounded-lg text-xs text-gray-700 mb-3">
                <Upload size={14} className="text-orange-500 shrink-0" />
                <span className="truncate">{revisionFile.name}</span>
                <button
                  onClick={() => setRevisionFile(null)}
                  className="ml-auto text-gray-400 hover:text-red-500 shrink-0"
                >×</button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-orange-300 rounded-xl text-sm text-orange-600 hover:bg-orange-100 transition-colors mb-3"
              >
                <Upload size={16} />
                Seleccionar archivo corregido
              </button>
            )}

            <textarea
              rows={2}
              placeholder="Notas sobre los cambios realizados (opcional)"
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              className="w-full text-xs border border-orange-200 rounded-lg p-3 mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
            />

            <button
              disabled={!revisionFile || revisionMutation.isPending}
              onClick={() => revisionMutation.mutate()}
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
            >
              {revisionMutation.isPending ? 'Enviando...' : 'Enviar corrección'}
            </button>
          </div>
        )}

        {/* Certificados */}
        {certs.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Mis certificados
            </h2>
            <div className="space-y-3">
              {certs.map((cert) => (
                <div key={cert.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-xs font-semibold text-gray-700">
                      {cert.productTypeName ?? 'Certificado de participación'}
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono">{cert.certificateNumber}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Emitido: {formatDate(cert.issuedAt)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {cert.hasFile && (
                      <button
                        onClick={() => downloadCert(cert.id, 'diploma')}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-primary-600 text-white text-[10px] font-semibold rounded-lg hover:bg-primary-500 transition-colors"
                      >
                        <Download size={10} /> Diploma
                      </button>
                    )}
                    {cert.hasFileCarta && (
                      <button
                        onClick={() => downloadCert(cert.id, 'carta')}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-600 text-white text-[10px] font-semibold rounded-lg hover:bg-gray-500 transition-colors"
                      >
                        <Download size={10} /> Carta
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Autores */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Autores
          </h2>
          <div className="space-y-2">
            {(submission.authors ?? []).map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 text-xs">
                <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-[10px] shrink-0">
                  {a.authorOrder + 1}
                </div>
                <div>
                  <p className="font-semibold text-gray-700">{a.fullName}</p>
                  <p className="text-gray-400">{a.academicTitle}</p>
                </div>
                {a.isCorresponding && (
                  <span className="ml-auto text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                    Correspondiente
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
