import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Search, Clock, CheckCircle, FileText, Mail, Award, Download,
  Loader2, ClipboardList,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { submissionsApi } from '../../api/submissions.api';
import { certificatesApi } from '../../api/certificates.api';
import { Submission } from '../../types';
import { STATUS_CONFIG, formatDate } from '../../utils';
import { useTheme } from '../../hooks/useTheme';
import { useScrollToTop } from '../../hooks/useScrollToTop';

type Tab = 'postulaciones' | 'certificados';

type PublicCert = {
  id: string;
  certificateNumber: string;
  verificationCode: string;
  authorName: string;
  titleEs: string;
  productTypeName: string;
  issuedAt: string;
  emailSentAt: string | null;
};

export default function CheckStatus() {
  const { isDark } = useTheme();
  useScrollToTop();

  const [activeTab, setActiveTab] = useState<Tab>('postulaciones');

  // — Postulaciones —
  const [subResults, setSubResults] = useState<Submission[] | null>(null);
  const [subLoading, setSubLoading] = useState(false);
  const { register: regSub, handleSubmit: handleSub } = useForm<{ query: string }>();

  // — Certificados —
  const [certResults,  setCertResults]  = useState<PublicCert[] | null>(null);
  const [certLoading,  setCertLoading]  = useState(false);
  const [downloading,  setDownloading]  = useState<string | null>(null);
  const { register: regCert, handleSubmit: handleCert } = useForm<{ query: string }>();

  /* ── Theme ──────────────────────────────────────────────────────────────── */
  const bg      = isDark ? 'bg-gray-950' : 'bg-white';
  const bgAlt   = isDark ? 'bg-gray-900' : 'bg-[#F5EDD8]';
  const text    = isDark ? 'text-gray-100' : 'text-gray-900';
  const textMut = isDark ? 'text-gray-400' : 'text-gray-500';
  const heading = isDark ? 'text-white'   : 'text-primary-900';
  const card    = isDark ? 'bg-gray-800 border-white/10' : 'bg-white border-gray-100';
  const input   = isDark
    ? 'bg-gray-800 border-white/15 text-gray-100 placeholder-gray-500 focus:border-primary-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-primary-400';

  /* ── Handlers ───────────────────────────────────────────────────────────── */
  const onSearchSub = async (data: { query: string }) => {
    const q = data.query.trim();
    setSubLoading(true);
    try {
      const isCode = /^SEMS-\d{4}-\d+$/i.test(q);
      const subs = isCode
        ? await submissionsApi.checkByCode(q.toUpperCase())
        : await submissionsApi.checkByEmail(q);
      setSubResults(subs);
      if (subs.length === 0) toast('No se encontraron postulaciones', { icon: 'ℹ️' });
    } catch {
      toast.error('Error al buscar postulaciones');
    } finally {
      setSubLoading(false);
    }
  };

  const onSearchCert = async (data: { query: string }) => {
    const q = data.query.trim();
    setCertLoading(true);
    try {
      const certs = await certificatesApi.searchPublic(q);
      setCertResults(certs);
      if (certs.length === 0) toast('No se encontraron certificados', { icon: 'ℹ️' });
    } catch {
      toast.error('Error al buscar certificados');
    } finally {
      setCertLoading(false);
    }
  };

  const handleDownload = async (code: string, fileName: string) => {
    setDownloading(code);
    try {
      const { url } = await certificatesApi.getPublicDownload(code);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
    } catch {
      toast.error('No se pudo descargar el certificado');
    } finally {
      setDownloading(null);
    }
  };

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className={`min-h-screen font-body ${bg} ${text}`}>

      {/* Hero */}
      <div className={`relative py-16 overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-primary-700'}`}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full border border-white/10" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full border border-white/5" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <span className={`text-[11px] font-bold uppercase tracking-[0.2em] block mb-3 ${isDark ? 'text-primary-400' : 'text-primary-200'}`}>
            II Simposio Internacional de Ciencia Abierta
          </span>
          <h1 className="font-heading font-black text-4xl md:text-5xl text-white mb-3">
            Portal de Consulta
          </h1>
          <div className="w-16 h-1 bg-amber-500 rounded-full mx-auto mb-4" />
          <p className={`max-w-xl mx-auto text-base ${isDark ? 'text-gray-400' : 'text-primary-100'}`}>
            Consulta el estado de tu postulación o descarga tus certificados de participación
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={`border-b ${isDark ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200'}`}>
        <div className="max-w-2xl mx-auto px-4 flex">
          {([
            { id: 'postulaciones', label: 'Estado de Postulación', Icon: ClipboardList },
            { id: 'certificados',  label: 'Mis Certificados',       Icon: Award },
          ] as { id: Tab; label: string; Icon: any }[]).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-primary-600 text-primary-600'
                  : `border-transparent ${textMut} hover:text-gray-700`
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={`py-14 ${bgAlt}`}>
        <div className="max-w-2xl mx-auto px-4">

          {/* ══ TAB 1 — POSTULACIONES ══ */}
          {activeTab === 'postulaciones' && (
            <>
              <div className={`rounded-2xl shadow-lg border p-8 mb-8 ${card}`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-primary-700/30 text-primary-400' : 'bg-primary-100 text-primary-700'}`}>
                    <Mail size={22} />
                  </div>
                  <div>
                    <h2 className={`font-heading font-bold text-lg ${heading}`}>Buscar postulación</h2>
                    <p className={`text-sm ${textMut}`}>Email del autor de correspondencia o código de referencia</p>
                  </div>
                </div>
                <form onSubmit={handleSub(onSearchSub)}>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      className={`flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all ${input}`}
                      placeholder="correo@institución.edu o SEMS-2026-0001"
                      {...regSub('query', { required: true })}
                    />
                    <button
                      type="submit"
                      disabled={subLoading}
                      className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg"
                    >
                      {subLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                      {subLoading ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>
                </form>
              </div>

              {subResults === null && (
                <div className={`rounded-xl p-5 border ${isDark ? 'bg-primary-900/20 border-primary-800/40' : 'bg-primary-50 border-primary-100'}`}>
                  <p className={`text-sm font-semibold mb-3 ${isDark ? 'text-primary-300' : 'text-primary-800'}`}>¿Cómo funciona?</p>
                  <ul className={`space-y-2 text-sm ${isDark ? 'text-primary-400' : 'text-primary-700'}`}>
                    {[
                      'Ingrese el email del autor de correspondencia de su postulación',
                      'Verá el estado actualizado y el historial de revisión',
                      'Use el código de referencia (SEMS-YYYY-XXXX) para identificar su trabajo',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle size={15} className="mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {subResults !== null && subResults.length === 0 && (
                <div className={`rounded-2xl border p-10 text-center ${card}`}>
                  <Search size={28} className={`mx-auto mb-3 ${textMut}`} />
                  <h3 className={`font-heading font-bold text-lg mb-2 ${heading}`}>Sin resultados</h3>
                  <p className={`text-sm ${textMut}`}>No se encontraron postulaciones para ese correo o código.</p>
                </div>
              )}

              {subResults && subResults.length > 0 && (
                <div className="space-y-4">
                  <p className={`text-sm font-semibold mb-4 ${textMut}`}>
                    {subResults.length} postulación{subResults.length > 1 ? 'es' : ''} encontrada{subResults.length > 1 ? 's' : ''}
                  </p>
                  {subResults.map((sub) => {
                    const cfg = STATUS_CONFIG[sub.status];
                    return (
                      <div key={sub.id} className={`rounded-2xl border shadow-sm p-6 ${card}`}>
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-primary-800/40 text-primary-400' : 'bg-primary-100 text-primary-700'}`}>
                              <FileText size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-mono font-bold mb-0.5 ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>{sub.referenceCode}</p>
                              <h4 className={`font-heading font-semibold text-sm leading-snug ${heading}`}>{sub.titleEs}</h4>
                            </div>
                          </div>
                          <span className={`badge flex-shrink-0 text-xs ${cfg?.bgColor} ${cfg?.textColor}`}>{cfg?.label || sub.status}</span>
                        </div>
                        <div className={`grid grid-cols-2 gap-3 text-sm mb-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                          {[
                            { label: 'Eje temático',     value: sub.thematicAxis?.name || '—' },
                            { label: 'Tipo de producto', value: sub.productType?.name  || '—' },
                            { label: 'Autores',          value: `${sub.authors.length} autor${sub.authors.length > 1 ? 'es' : ''}` },
                            { label: 'Enviado',          value: formatDate(sub.createdAt) },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <span className={`font-medium block text-xs uppercase tracking-wide mb-0.5 ${textMut}`}>{label}</span>
                              <span className={`font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{value}</span>
                            </div>
                          ))}
                        </div>
                        {sub.statusHistory && sub.statusHistory.length > 1 && (
                          <div className={`pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                            <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${textMut}`}>Historial</p>
                            <div className="space-y-2">
                              {sub.statusHistory.slice(0, 4).map((h) => (
                                <div key={h.id} className="flex items-center gap-2.5 text-xs">
                                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isDark ? 'bg-primary-500' : 'bg-primary-400'}`} />
                                  <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{STATUS_CONFIG[h.newStatus]?.label}</span>
                                  <span className={textMut}>·</span>
                                  <span className={textMut}>{formatDate(h.createdAt)}</span>
                                  {h.notes && <><span className={textMut}>–</span><span className={`italic ${textMut}`}>{h.notes}</span></>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {sub.usesAi && (
                          <div className={`mt-4 pt-4 border-t text-xs flex items-start gap-2 ${isDark ? 'border-white/10 text-amber-400' : 'border-gray-100 text-amber-600'}`}>
                            <Clock size={13} className="mt-0.5 flex-shrink-0" />
                            <span>Este trabajo declara uso de Inteligencia Artificial</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ══ TAB 2 — CERTIFICADOS ══ */}
          {activeTab === 'certificados' && (
            <>
              <div className={`rounded-2xl shadow-lg border p-8 mb-8 ${card}`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-700/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                    <Award size={22} />
                  </div>
                  <div>
                    <h2 className={`font-heading font-bold text-lg ${heading}`}>Buscar certificados</h2>
                    <p className={`text-sm ${textMut}`}>Por correo electrónico o número de certificado (CERT-YYYY-NNNN)</p>
                  </div>
                </div>
                <form onSubmit={handleCert(onSearchCert)}>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      className={`flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all ${input}`}
                      placeholder="correo@institución.edu o CERT-2026-0001"
                      {...regCert('query', { required: true })}
                    />
                    <button
                      type="submit"
                      disabled={certLoading}
                      className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg"
                    >
                      {certLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                      {certLoading ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>
                </form>
              </div>

              {certResults === null && (
                <div className={`rounded-xl p-5 border ${isDark ? 'bg-amber-900/20 border-amber-800/40' : 'bg-amber-50 border-amber-100'}`}>
                  <p className={`text-sm font-semibold mb-3 ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>¿Cómo funciona?</p>
                  <ul className={`space-y-2 text-sm ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                    {[
                      'Ingrese el correo con el que se registró en el simposio',
                      'Si tiene varios certificados se mostrarán todos en una lista',
                      'Ingrese el número (CERT-YYYY-NNNN) para buscarlo directamente',
                      'Puede descargar cada certificado en PDF desde los resultados',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle size={15} className="mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {certResults !== null && certResults.length === 0 && (
                <div className={`rounded-2xl border p-10 text-center ${card}`}>
                  <Award size={28} className={`mx-auto mb-3 ${textMut}`} />
                  <h3 className={`font-heading font-bold text-lg mb-2 ${heading}`}>Sin certificados</h3>
                  <p className={`text-sm ${textMut}`}>No se encontraron certificados para ese correo o número.</p>
                  <p className={`text-xs mt-2 ${textMut}`}>Los certificados se generan una vez que la participación ha sido confirmada.</p>
                </div>
              )}

              {certResults && certResults.length > 0 && (
                <div className="space-y-4">
                  <p className={`text-sm font-semibold mb-4 ${textMut}`}>
                    {certResults.length} certificado{certResults.length > 1 ? 's' : ''} encontrado{certResults.length > 1 ? 's' : ''}
                  </p>
                  {certResults.map((cert) => (
                    <div key={cert.id} className={`rounded-2xl border shadow-sm p-5 ${card}`}>
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-amber-800/40 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                          <Award size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-mono font-bold mb-0.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                            {cert.certificateNumber}
                          </p>
                          <p className={`font-semibold text-sm mb-0.5 ${heading}`}>{cert.authorName}</p>
                          <p className={`text-xs italic mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'} line-clamp-2`}>
                            "{cert.titleEs}"
                          </p>
                          <div className={`flex flex-wrap gap-2 text-xs ${textMut}`}>
                            <span>{cert.productTypeName}</span>
                            <span>·</span>
                            <span>Emitido: {formatDate(cert.issuedAt)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleDownload(cert.verificationCode, `${cert.certificateNumber}.pdf`)}
                            disabled={downloading === cert.verificationCode}
                            className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                          >
                            {downloading === cert.verificationCode
                              ? <Loader2 size={12} className="animate-spin" />
                              : <Download size={12} />}
                            Descargar
                          </button>
                          <Link
                            to={`/certificado/${cert.verificationCode}`}
                            className={`flex items-center gap-1.5 justify-center text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${isDark ? 'border-white/20 text-gray-300 hover:bg-white/10' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                          >
                            <CheckCircle size={12} />
                            Verificar
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
