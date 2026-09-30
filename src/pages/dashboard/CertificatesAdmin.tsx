import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Award, Download, Send, Trash2, Search, Filter,
  CheckCircle, Clock, RefreshCw, Loader2,
} from 'lucide-react';
import { certificatesApi } from '../../api/certificates.api';
import { productTypesApi, usersApi } from '../../api/index';
import { submissionsApi } from '../../api/submissions.api';
import { eventsApi } from '../../api/events.api';
import EventPicker from '../../components/dashboard/EventPicker';
import { formatDate } from '../../utils';
import { Certificate } from '../../types';

export default function CertificatesAdmin() {
  const { data: activeEvent } = useQuery({ queryKey: ['event-active'], queryFn: eventsApi.getActive });
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);

  // Por defecto se muestra el evento activo, pero el admin puede cambiarlo
  // para consultar certificados de ediciones anteriores.
  useEffect(() => {
    if (!selectedEventId && activeEvent?.id) setSelectedEventId(activeEvent.id);
  }, [activeEvent, selectedEventId]);

  const activeEventId = selectedEventId;
  const qc            = useQueryClient();

  const [filterProductType, setFilterProductType] = useState('');
  const [filterSent,        setFilterSent]        = useState('');
  const [search,            setSearch]            = useState('');
  const [selected,          setSelected]          = useState<Set<string>>(new Set());
  const [bulkLoading,       setBulkLoading]       = useState(false);
  const [activeTab,         setActiveTab]         = useState<'peer' | 'author' | 'history'>('peer');

  const { data: certs = [], isLoading, refetch } = useQuery({
    queryKey: ['certificates', activeEventId, filterProductType, filterSent],
    queryFn: () => certificatesApi.getAll({
      eventId:       activeEventId || undefined,
      productTypeId: filterProductType || undefined,
      sent:          (filterSent as 'true' | 'false') || undefined,
    }),
    enabled: !!activeEventId,
  });

  const { data: productTypes = [] } = useQuery({
    queryKey: ['product-types'],
    queryFn: () => productTypesApi.getAll(true),
  });

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: usersApi.getAll });
  const usersById = Object.fromEntries(users.map(u => [u.id, u]));

  const bookChapterTypeId = productTypes.find(
    pt => pt.name.toLowerCase().includes('cap') && pt.name.toLowerCase().includes('libro'),
  )?.id;

  const { data: bookChapterSubmissions = [] } = useQuery({
    queryKey: ['submissions-book-chapters', activeEventId, bookChapterTypeId],
    queryFn: () => submissionsApi.getAll({ eventId: activeEventId, productTypeId: bookChapterTypeId }),
    enabled: !!activeEventId && !!bookChapterTypeId,
  });
  const reviewedChapters = bookChapterSubmissions.filter(s => !!(s as any).assignedEvaluatorId);

  const { data: peerReviewerCerts = [] } = useQuery({
    queryKey: ['certificates-peer-reviewer', activeEventId],
    queryFn: () => certificatesApi.getAll({ eventId: activeEventId, certificateType: 'peer_reviewer' }),
    enabled: !!activeEventId,
  });
  const certifiedSubmissionIds = new Set(peerReviewerCerts.map(c => c.submissionId).filter(Boolean));

  // Trabajos ejecutados (ponencias, capítulos, etc.) — certificado de autor/ponente
  const { data: allSubmissions = [] } = useQuery({
    queryKey: ['submissions-executed', activeEventId],
    queryFn: () => submissionsApi.getAll({ eventId: activeEventId }),
    enabled: !!activeEventId,
  });
  const productTypesById = Object.fromEntries(productTypes.map(pt => [pt.id, pt]));
  const executedEntries = allSubmissions.flatMap((sub: any) => {
    const ids = sub.productTypeIds ?? (sub.productTypeId ? [sub.productTypeId] : []);
    return ids
      .filter((ptId: string) => ['executed', 'certificate_sent'].includes((sub.productStatuses ?? {})[ptId]))
      .map((ptId: string) => ({ sub, ptId }));
  });
  const authorCertifiedKeys = new Set(
    certs
      .filter(c => c.certificateType !== 'peer_reviewer' && c.submissionId && c.productTypeId)
      .map(c => `${c.submissionId}:${c.productTypeId}`),
  );

  const [generatingPeerCertId, setGeneratingPeerCertId] = useState<string | null>(null);
  const [generatingAuthorCertKey, setGeneratingAuthorCertKey] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => certificatesApi.remove(id),
    onSuccess: () => { toast.success('Certificado eliminado'); qc.invalidateQueries({ queryKey: ['certificates'] }); },
    onError: () => toast.error('Error al eliminar'),
  });

  const handleDownload = async (cert: Certificate) => {
    try {
      const { url, fileName } = await certificatesApi.getDownloadUrl(cert.id);
      const a = document.createElement('a');
      a.href = url; a.download = fileName; a.target = '_blank';
      a.click();
    } catch { toast.error('Error al descargar'); }
  };

  const handleResend = async (cert: Certificate) => {
    try {
      const r = await certificatesApi.send([cert.id]);
      if (r.sent > 0) {
        toast.success(`Certificado reenviado a ${cert.author?.email}`);
        refetch();
      } else {
        toast.error('No se pudo reenviar el certificado');
      }
    } catch { toast.error('Error al reenviar'); }
  };

  const handleBulkSend = async () => {
    if (!activeEventId) { toast.error('Seleccione un evento primero'); return; }
    setBulkLoading(true);
    try {
      // No se aplica filterProductType: ese filtro vive en la pestaña Historial y no debe
      // afectar silenciosamente este envío masivo de Autores/Ponentes.
      const r = await certificatesApi.bulkGenerateAndSend(activeEventId);
      toast.success(`Procesadas ${r.processed} postulaciones · ${r.sent} certificados enviados`);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error en envío masivo');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleGeneratePeerReviewerCert = async (submissionId: string) => {
    setGeneratingPeerCertId(submissionId);
    try {
      const r = await certificatesApi.generateAndSendPeerReviewer(submissionId);
      if (r.sent > 0) toast.success('Certificado de par académico generado y enviado');
      else toast.error('El certificado se generó pero no se pudo enviar el correo');
      qc.invalidateQueries({ queryKey: ['certificates-peer-reviewer'] });
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al generar el certificado');
    } finally {
      setGeneratingPeerCertId(null);
    }
  };

  const handleGenerateAuthorCert = async (submissionId: string, productTypeId: string) => {
    const key = `${submissionId}:${productTypeId}`;
    setGeneratingAuthorCertKey(key);
    try {
      const r = await certificatesApi.generateAndSend(submissionId, productTypeId);
      if (r.sent > 0) toast.success(`${r.generated} certificado(s) generados · ${r.sent} enviados`);
      else toast.error('El certificado se generó pero no se pudo enviar el correo');
      qc.invalidateQueries({ queryKey: ['certificates'] });
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al generar el certificado');
    } finally {
      setGeneratingAuthorCertKey(null);
    }
  };

  const handleSendSelected = async () => {
    if (selected.size === 0) return;
    try {
      const r = await certificatesApi.send([...selected]);
      toast.success(`${r.sent} enviados · ${r.failed} fallidos`);
      setSelected(new Set());
      refetch();
    } catch { toast.error('Error al enviar'); }
  };

  const filtered = certs.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.certificateNumber?.toLowerCase().includes(q) ||
      c.author?.fullName?.toLowerCase().includes(q) ||
      c.submission?.titleEs?.toLowerCase().includes(q) ||
      c.submission?.referenceCode?.toLowerCase().includes(q)
    );
  });

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(c => c.id)));
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <Award size={20} className="text-primary-700" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl text-gray-900">Certificados</h1>
            <p className="text-sm text-gray-500">{certs.length} registros</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de evento */}
          <EventPicker value={selectedEventId} onChange={setSelectedEventId} />
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto">
        {[
          { key: 'peer' as const,    label: 'Par Académico',      count: reviewedChapters.length },
          { key: 'author' as const,  label: 'Autores / Ponentes', count: executedEntries.length },
          { key: 'history' as const, label: 'Historial',          count: certs.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === tab.key
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Certificado de Par Académico — uno por cada capítulo de libro revisado */}
      {activeTab === 'peer' && (
        <div className="card">
          <h2 className="font-heading font-semibold text-sm text-gray-800 mb-1">
            Certificados de Par Académico — Capítulos de Libro
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Se genera un certificado por cada capítulo de libro con evaluador asignado, específico
            para ese trabajo (no uno genérico por evento).
          </p>
          {!bookChapterTypeId ? (
            <p className="text-xs text-gray-400 italic">No hay un tipo de producto "Capítulo de Libro" configurado.</p>
          ) : reviewedChapters.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No hay capítulos de libro con evaluador asignado en este evento.</p>
          ) : (
            <div className="space-y-2">
              {reviewedChapters.map((sub: any) => {
                const evaluator = usersById[sub.assignedEvaluatorId];
                const alreadyCertified = certifiedSubmissionIds.has(sub.id);
                return (
                  <div key={sub.id} className="flex items-center justify-between gap-3 border border-gray-100 rounded-lg px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 truncate">{sub.titleEs}</p>
                      <p className="text-xs text-gray-400 font-mono">{sub.referenceCode}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Evaluador: {evaluator ? `${evaluator.firstName} ${evaluator.lastName}` : '—'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (alreadyCertified) {
                          const evaluatorName = evaluator ? `${evaluator.firstName} ${evaluator.lastName}` : 'el evaluador asignado';
                          const ok = confirm(
                            `¿Regenerar el certificado de par académico de ${evaluatorName}?\n\n` +
                            'Se volverá a generar el PDF y se reenviará por correo al evaluador (el número de certificado se conserva). ' +
                            'Úselo solo si necesita corregir algún dato o reenviar porque el correo anterior no llegó.',
                          );
                          if (!ok) return;
                        }
                        handleGeneratePeerReviewerCert(sub.id);
                      }}
                      disabled={generatingPeerCertId === sub.id}
                      className={`btn-sm flex items-center gap-2 flex-shrink-0 ${alreadyCertified ? 'btn-outline' : 'btn-primary'}`}
                    >
                      {generatingPeerCertId === sub.id
                        ? <Loader2 size={14} className="animate-spin" />
                        : alreadyCertified ? <RefreshCw size={14} /> : <Send size={14} />}
                      {alreadyCertified ? 'Regenerar y reenviar' : 'Generar y enviar'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Certificados de Autores / Ponentes — uno por cada trabajo ejecutado */}
      {activeTab === 'author' && (
        <div className="card">
          <div className="flex items-center justify-between gap-3 mb-1">
            <h2 className="font-heading font-semibold text-sm text-gray-800">
              Certificados de Autores / Ponentes
            </h2>
            <button
              onClick={handleBulkSend}
              disabled={bulkLoading}
              className="btn-outline btn-sm flex items-center gap-2 flex-shrink-0"
            >
              {bulkLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Envío masivo ejecutados
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Se genera un certificado para cada autor ponente del trabajo (uno por tipo de producto
            ejecutado). El de par académico es aparte y solo aplica a evaluadores.
          </p>
          {executedEntries.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No hay trabajos ejecutados pendientes de certificar en este evento.</p>
          ) : (
            <div className="space-y-2">
              {executedEntries.map(({ sub, ptId }: any) => {
                const key = `${sub.id}:${ptId}`;
                const alreadyCertified = authorCertifiedKeys.has(key);
                return (
                  <div key={key} className="flex items-center justify-between gap-3 border border-gray-100 rounded-lg px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 truncate">{sub.titleEs}</p>
                      <p className="text-xs text-gray-400 font-mono">{sub.referenceCode}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {productTypesById[ptId]?.name ?? 'Tipo de producto'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (alreadyCertified) {
                          const ok = confirm(
                            `¿Regenerar el certificado de "${productTypesById[ptId]?.name ?? 'este tipo de producto'}" para "${sub.titleEs}"?\n\n` +
                            'Se volverá a generar el PDF y se reenviará por correo al autor/ponente (el número de certificado se conserva). ' +
                            'Úselo solo si necesita corregir algún dato o reenviar porque el correo anterior no llegó.',
                          );
                          if (!ok) return;
                        }
                        handleGenerateAuthorCert(sub.id, ptId);
                      }}
                      disabled={generatingAuthorCertKey === key}
                      className={`btn-sm flex items-center gap-2 flex-shrink-0 ${alreadyCertified ? 'btn-outline' : 'btn-primary'}`}
                    >
                      {generatingAuthorCertKey === key
                        ? <Loader2 size={14} className="animate-spin" />
                        : alreadyCertified ? <RefreshCw size={14} /> : <Send size={14} />}
                      {alreadyCertified ? 'Regenerar y reenviar' : 'Generar y enviar'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <>
          {/* Filtros */}
          <div className="card">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por N°, autor, título..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="form-input pl-9 text-sm"
                />
              </div>
              <select
                value={filterProductType}
                onChange={e => setFilterProductType(e.target.value)}
                className="form-input text-sm"
              >
                <option value="">Todos los tipos</option>
                {productTypes.map(pt => (
                  <option key={pt.id} value={pt.id}>{pt.name}</option>
                ))}
              </select>
              <select
                value={filterSent}
                onChange={e => setFilterSent(e.target.value)}
                className="form-input text-sm"
              >
                <option value="">Todos los estados</option>
                <option value="true">Enviados</option>
                <option value="false">Pendientes de envío</option>
              </select>
              {selected.size > 0 && (
                <button
                  onClick={handleSendSelected}
                  className="btn-primary btn-sm flex items-center justify-center gap-2"
                >
                  <Send size={14} /> Enviar seleccionados ({selected.size})
                </button>
              )}
            </div>
          </div>

          {/* Tabla */}
          <div className="card p-0 overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <Award size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No hay certificados con estos filtros</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selected.size === filtered.length && filtered.length > 0}
                          onChange={toggleAll}
                          className="w-4 h-4 accent-primary-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">N° Certificado</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Autor</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Título / Referencia</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Tipo</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Emitido</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Estado</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600 text-xs uppercase tracking-wide">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((cert) => (
                      <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(cert.id)}
                            onChange={() => toggleSelect(cert.id)}
                            className="w-4 h-4 accent-primary-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                            {cert.certificateNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {cert.certificateType === 'peer_reviewer' ? (
                            <div>
                              <p className="font-medium text-gray-800">
                                {cert.evaluator ? `${cert.evaluator.firstName} ${cert.evaluator.lastName}` : ''}
                              </p>
                              <p className="text-xs text-gray-400">{cert.evaluator?.email}</p>
                              <span className="text-xs text-[#007F3A] font-medium">Par Académico</span>
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium text-gray-800">{cert.author?.fullName}</p>
                              <p className="text-xs text-gray-400">{cert.author?.email}</p>
                              {cert.author?.isCorresponding && (
                                <span className="text-xs text-primary-600 font-medium">Autor Principal</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          {cert.submission ? (
                            <>
                              <p className="text-gray-800 line-clamp-2 text-xs">{cert.submission.titleEs}</p>
                              <p className="text-gray-400 text-xs font-mono mt-0.5">{cert.submission.referenceCode}</p>
                            </>
                          ) : (
                            <p className="text-gray-400 text-xs italic">— No aplica —</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                            {cert.productTypeName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(cert.issuedAt)}
                        </td>
                        <td className="px-4 py-3">
                          {cert.emailSentAt ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle size={11} /> Enviado
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                              <Clock size={11} /> Pendiente
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleDownload(cert)}
                              title="Descargar PDF"
                              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-primary-600 transition-colors"
                            >
                              <Download size={15} />
                            </button>
                            <button
                              onClick={() => handleResend(cert)}
                              title="Reenviar por correo"
                              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                            >
                              <Send size={15} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('¿Eliminar este certificado?')) deleteMutation.mutate(cert.id);
                              }}
                              title="Eliminar"
                              className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Resumen */}
          {certs.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total', value: certs.length, color: 'text-gray-800' },
                { label: 'Enviados', value: certs.filter(c => c.emailSentAt).length, color: 'text-emerald-700' },
                { label: 'Pendientes', value: certs.filter(c => !c.emailSentAt).length, color: 'text-amber-700' },
                { label: 'Autores distintos', value: new Set(certs.map(c => c.authorId)).size, color: 'text-primary-700' },
              ].map(({ label, value, color }) => (
                <div key={label} className="card p-4 text-center">
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
