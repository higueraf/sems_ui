import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Search, Clock, CheckCircle, FileText, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { submissionsApi } from '../../api/submissions.api';
import { Submission } from '../../types';
import { STATUS_CONFIG, formatDate } from '../../utils';
import { useTheme } from '../../hooks/useTheme';

export default function CheckStatus() {
  const { isDark } = useTheme();
  const [results, setResults] = useState<Submission[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit } = useForm<{ email: string }>();

  /* Theme helpers */
  const bg     = isDark ? 'bg-gray-950' : 'bg-white';
  const bgAlt  = isDark ? 'bg-gray-900' : 'bg-[#F5EDD8]';
  const text   = isDark ? 'text-gray-100' : 'text-gray-900';
  const textMut= isDark ? 'text-gray-400' : 'text-gray-500';
  const heading= isDark ? 'text-white' : 'text-primary-900';
  const card   = isDark ? 'bg-gray-800 border-white/10' : 'bg-white border-gray-100';
  const input  = isDark ? 'bg-gray-800 border-white/15 text-gray-100 placeholder-gray-500 focus:border-primary-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-primary-400';

  const onSearch = async (data: { email: string }) => {
    setIsLoading(true);
    try {
      const subs = await submissionsApi.checkByEmail(data.email);
      setResults(subs);
      if (subs.length === 0) toast('No se encontraron postulaciones con ese correo', { icon: 'ℹ️' });
    } catch {
      toast.error('Error al buscar postulaciones');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen font-body ${bg} ${text}`}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className={`relative py-16 overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-primary-700'}`}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full border border-white/10" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full border border-white/5" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-white/3 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <span className={`text-[11px] font-bold uppercase tracking-[0.2em] block mb-3 ${isDark ? 'text-primary-400' : 'text-primary-200'}`}>
            II Simposio Internacional de Ciencia Abierta
          </span>
          <h1 className="font-heading font-black text-4xl md:text-5xl text-white mb-3">
            Verificar Estado
          </h1>
          <div className="w-16 h-1 bg-amber-500 rounded-full mx-auto mb-4" />
          <p className={`max-w-xl mx-auto text-base ${isDark ? 'text-gray-400' : 'text-primary-100'}`}>
            Consulte el estado de su postulación ingresando el correo electrónico del autor de correspondencia
          </p>
        </div>
      </div>

      {/* ── Search form ──────────────────────────────────────────────── */}
      <div className={`py-14 ${bgAlt}`}>
        <div className="max-w-2xl mx-auto px-4">

          <div className={`rounded-2xl shadow-lg border p-8 mb-8 ${card}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-primary-700/30 text-primary-400' : 'bg-primary-100 text-primary-700'}`}>
                <Mail size={22} />
              </div>
              <div>
                <h2 className={`font-heading font-bold text-lg ${heading}`}>Buscar por correo</h2>
                <p className={`text-sm ${textMut}`}>Ingrese el email del autor de correspondencia</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSearch)}>
              <div className="flex gap-3">
                <input
                  type="email"
                  className={`flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all ${input}`}
                  placeholder="correo@institución.edu"
                  {...register('email', { required: true })}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg"
                >
                  <Search size={18} />
                  {isLoading ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
            </form>
          </div>

          {/* ── How it works hint ─────────────────────────────────── */}
          {results === null && (
            <div className={`rounded-xl p-5 border ${isDark ? 'bg-primary-900/20 border-primary-800/40' : 'bg-primary-50 border-primary-100'}`}>
              <p className={`text-sm font-semibold mb-3 ${isDark ? 'text-primary-300' : 'text-primary-800'}`}>
                ¿Cómo funciona?
              </p>
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

          {/* ── No results ────────────────────────────────────────── */}
          {results !== null && results.length === 0 && (
            <div className={`rounded-2xl border p-10 text-center ${card}`}>
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <Search size={28} className={textMut} />
              </div>
              <h3 className={`font-heading font-bold text-lg mb-2 ${heading}`}>Sin resultados</h3>
              <p className={`text-sm ${textMut}`}>No se encontraron postulaciones para ese correo electrónico.</p>
              <p className={`text-xs mt-2 ${textMut}`}>Verifique que ingresó correctamente el email del autor de correspondencia.</p>
            </div>
          )}

          {/* ── Results ───────────────────────────────────────────── */}
          {results && results.length > 0 && (
            <div className="space-y-4">
              <p className={`text-sm font-semibold mb-4 ${textMut}`}>
                {results.length} postulación{results.length > 1 ? 'es' : ''} encontrada{results.length > 1 ? 's' : ''}
              </p>

              {results.map((sub) => {
                const cfg = STATUS_CONFIG[sub.status];
                return (
                  <div key={sub.id} className={`rounded-2xl border shadow-sm p-6 ${card}`}>

                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-primary-800/40 text-primary-400' : 'bg-primary-100 text-primary-700'}`}>
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-mono font-bold mb-0.5 ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
                            {sub.referenceCode}
                          </p>
                          <h4 className={`font-heading font-semibold text-sm leading-snug ${heading}`}>{sub.titleEs}</h4>
                        </div>
                      </div>
                      <span className={`badge flex-shrink-0 text-xs ${cfg?.bgColor} ${cfg?.textColor}`}>
                        {cfg?.label || sub.status}
                      </span>
                    </div>

                    {/* Details grid */}
                    <div className={`grid grid-cols-2 gap-3 text-sm mb-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                      {[
                        { label: 'Eje temático', value: sub.thematicAxis?.name || '—' },
                        { label: 'Tipo de producto', value: sub.productType?.name || '—' },
                        { label: 'Autores', value: `${sub.authors.length} autor${sub.authors.length > 1 ? 'es' : ''}` },
                        { label: 'Enviado', value: formatDate(sub.createdAt) },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <span className={`font-medium block text-xs uppercase tracking-wide mb-0.5 ${textMut}`}>{label}</span>
                          <span className={`font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Status history */}
                    {sub.statusHistory && sub.statusHistory.length > 1 && (
                      <div className={`pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                        <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${textMut}`}>Historial</p>
                        <div className="space-y-2">
                          {sub.statusHistory.slice(0, 4).map((h) => (
                            <div key={h.id} className="flex items-center gap-2.5 text-xs">
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isDark ? 'bg-primary-500' : 'bg-primary-400'}`} />
                              <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {STATUS_CONFIG[h.newStatus]?.label}
                              </span>
                              <span className={textMut}>·</span>
                              <span className={textMut}>{formatDate(h.createdAt)}</span>
                              {h.notes && (
                                <>
                                  <span className={textMut}>–</span>
                                  <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} italic`}>{h.notes}</span>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI usage note */}
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
        </div>
      </div>
    </div>
  );
}
