import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, Filter, Eye, ChevronDown, Mail, X, Send,
  AlertTriangle, CheckCircle, Loader2,
} from 'lucide-react';
import RichTextEditor from '../../components/ui/RichTextEditor';
import { eventsApi } from '../../api/events.api';
import { submissionsApi } from '../../api/submissions.api';
import { thematicAxesApi } from '../../api/index';
import { Submission } from '../../types';
import { STATUS_CONFIG, formatDate } from '../../utils';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'received', label: 'Recibidas' },
  { value: 'under_review', label: 'En Revisión' },
  { value: 'revision_requested', label: 'Revisión Requerida' },
  { value: 'approved', label: 'Aprobadas' },
  { value: 'rejected', label: 'Rechazadas' },
  { value: 'withdrawn', label: 'Retiradas' },
  { value: 'scheduled', label: 'Programadas' },
];

// ─── Modal de correo masivo ───────────────────────────────────────────────────
function BulkEmailModal({
  eventId,
  totalAll,
  onClose,
}: {
  eventId: string;
  totalAll: number;
  onClose: () => void;
}) {
  const [filterStatus, setFilterStatus] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ queued: number; message: string } | null>(null);
  const [error, setError] = useState('');

  // Calcular cuántos recibirán el correo según el filtro seleccionado
  const { data: previewData } = useQuery({
    queryKey: ['submissions-count', eventId, filterStatus],
    queryFn: () =>
      submissionsApi.getAll({
        eventId,
        status: filterStatus || undefined,
      }),
  });
  const recipientCount = previewData?.length ?? 0;

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      setError('El asunto y el cuerpo del correo son obligatorios.');
      return;
    }
    if (recipientCount === 0) {
      setError('No hay destinatarios para el filtro seleccionado.');
      return;
    }
    setError('');
    setSending(true);
    try {
      const res = await submissionsApi.sendBulkEmail({
        subject,
        body,
        eventId,
        status: filterStatus || undefined,
      });
      setResult(res);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error al iniciar el envío masivo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center">
              <Mail size={18} className="text-primary-600" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-gray-900 text-lg">Envío Masivo de Correos</h2>
              <p className="text-xs text-gray-500">Los correos se despachan en segundo plano</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Resultado exitoso */}
          {result ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">¡Envío iniciado!</p>
                <p className="text-gray-500 text-sm mt-1">{result.message}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-sm text-green-700 font-medium">
                {result.queued} correo{result.queued !== 1 ? 's' : ''} en cola de despacho
              </div>
              <p className="text-xs text-gray-400">
                Puedes cerrar esta ventana. Los correos se envían automáticamente en segundo plano con un intervalo de 300ms entre cada uno.
              </p>
              <button onClick={onClose} className="btn-primary">
                Cerrar
              </button>
            </div>
          ) : (
            <>
              {/* Filtro de destinatarios */}
              <div>
                <label className="form-label">Destinatarios</label>
                <div className="relative">
                  <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="form-input pl-9 py-2.5 text-sm appearance-none"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.value === '' ? `Todos los postulantes (${totalAll})` : opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                {/* Contador de destinatarios */}
                <div className={`mt-2 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2
                  ${recipientCount === 0
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-primary-50 text-primary-700'
                  }`}>
                  <Mail size={14} />
                  {recipientCount === 0
                    ? 'Sin destinatarios para este filtro'
                    : `${recipientCount} postulante${recipientCount !== 1 ? 's' : ''} recibirán este correo`
                  }
                </div>
              </div>

              {/* Asunto */}
              <div>
                <label className="form-label">Asunto <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ej: Actualización importante sobre su postulación"
                  className="form-input py-2.5 text-sm"
                />
              </div>

              {/* Cuerpo WYSIWYG */}
              <div>
                <label className="form-label">
                  Mensaje <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs font-normal text-gray-400">(negrita, listas, alineación, colores, etc.)</span>
                </label>
                <RichTextEditor
                  value={body}
                  onChange={setBody}
                  placeholder="Redacte aquí el mensaje para los postulantes..."
                  minHeight={200}
                />
                <p className="text-xs text-gray-400 mt-1">
                  El mensaje se integrará en la plantilla HTML oficial del simposio.
                </p>
              </div>

              {/* Advertencia antes de enviar */}
              {recipientCount > 10 && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700">
                    Vas a enviar <strong>{recipientCount} correos</strong>. Esta acción no se puede deshacer.
                    El envío tardará aproximadamente{' '}
                    <strong>{Math.ceil((recipientCount * 0.3) / 60)} min</strong> en completarse.
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                  <AlertTriangle size={15} />
                  {error}
                </div>
              )}

              {/* Acciones */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  onClick={onClose}
                  className="btn-secondary"
                  disabled={sending}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending || recipientCount === 0}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Iniciando...
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      Enviar a {recipientCount} postulante{recipientCount !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Submissions() {
  const [params] = useSearchParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(params.get('status') || '');
  const [axisId, setAxisId] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);

  const { data: event } = useQuery({ queryKey: ['event-active'], queryFn: eventsApi.getActive });
  const { data: axes } = useQuery({
    queryKey: ['axes-admin', event?.id],
    queryFn: () => thematicAxesApi.getAll(event!.id),
    enabled: !!event?.id,
  });
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['submissions', event?.id, status, axisId, search],
    queryFn: () =>
      submissionsApi.getAll({
        eventId: event?.id,
        status: status || undefined,
        thematicAxisId: axisId || undefined,
        search: search || undefined,
      }),
    enabled: !!event?.id,
  });

  // Total sin filtro para mostrar en el modal
  const { data: allSubmissions } = useQuery({
    queryKey: ['submissions-all', event?.id],
    queryFn: () => submissionsApi.getAll({ eventId: event?.id }),
    enabled: !!event?.id,
  });

  return (
    <div className="space-y-5">
      {/* Modal de envío masivo */}
      {showBulkModal && event?.id && (
        <BulkEmailModal
          eventId={event.id}
          totalAll={allSubmissions?.length ?? 0}
          onClose={() => setShowBulkModal(false)}
        />
      )}

      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl text-gray-900">Postulaciones</h1>
        <div className="flex items-center gap-3">
          {/* Botón de correo masivo */}
          <button
            onClick={() => setShowBulkModal(true)}
            className="btn-secondary flex items-center gap-2 text-sm"
            title="Enviar correo masivo a postulantes"
          >
            <Mail size={15} />
            <span className="hidden sm:inline">Correo masivo</span>
          </button>
          <span className="badge bg-blue-100 text-blue-700 text-sm">
            {submissions?.length ?? 0} registros
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="card !p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, código, autor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-9 py-2.5 text-sm"
            />
          </div>
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="form-input pl-9 py-2.5 text-sm appearance-none"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={axisId}
              onChange={(e) => setAxisId(e.target.value)}
              className="form-input py-2.5 text-sm appearance-none"
            >
              <option value="">Todos los ejes</option>
              {axes?.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Código</th>
                  <th className="table-th">Título</th>
                  <th className="table-th">Eje Temático</th>
                  <th className="table-th">Autores</th>
                  <th className="table-th">Estado</th>
                  <th className="table-th">Fecha</th>
                  <th className="table-th">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {submissions?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="table-td text-center text-gray-400 py-10">
                      No se encontraron postulaciones
                    </td>
                  </tr>
                ) : (
                  submissions?.map((sub: Submission) => {
                    const cfg = STATUS_CONFIG[sub.status];
                    const corresponding = sub.authors.find((a) => a.isCorresponding) || sub.authors[0];
                    return (
                      <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                        <td className="table-td">
                          <span className="font-mono text-xs text-primary-600 font-semibold">
                            {sub.referenceCode}
                          </span>
                        </td>
                        <td className="table-td max-w-xs">
                          <p className="font-medium text-gray-900 line-clamp-2 text-sm leading-tight">
                            {sub.titleEs}
                          </p>
                        </td>
                        <td className="table-td">
                          <span
                            className="badge text-white text-xs"
                            style={{ backgroundColor: sub.thematicAxis?.color || '#888' }}
                          >
                            {sub.thematicAxis?.name || '—'}
                          </span>
                        </td>
                        <td className="table-td">
                          <div className="text-sm">
                            <p className="font-medium text-gray-700">{corresponding?.fullName}</p>
                            {sub.authors.length > 1 && (
                              <p className="text-xs text-gray-400">+{sub.authors.length - 1} más</p>
                            )}
                            {corresponding?.country && (
                              <span className="text-base">{corresponding.country.flagEmoji}</span>
                            )}
                          </div>
                        </td>
                        <td className="table-td">
                          <span className={`badge ${cfg?.bgColor} ${cfg?.textColor}`}>
                            {cfg?.label || sub.status}
                          </span>
                        </td>
                        <td className="table-td text-gray-500 text-xs whitespace-nowrap">
                          {formatDate(sub.createdAt)}
                        </td>
                        <td className="table-td">
                          <Link
                            to={`/dashboard/postulaciones/${sub.id}`}
                            className="btn-primary btn-sm flex items-center gap-1 !py-1.5"
                          >
                            <Eye size={14} />
                            Ver
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
