import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, AlignLeft, Image, Shield, Upload, CheckCircle, Award, Book,
  Download, Presentation, FileIcon, Loader2,
} from 'lucide-react';
import { eventsApi } from '../../api/events.api';
import { guidelinesApi } from '../../api/index';
import { useTheme } from '../../hooks/useTheme';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import { Guideline } from '../../types';
import toast from 'react-hot-toast';

/** Botón de descarga para pautas con archivo en Backblaze B2 (privado) */
function DownloadGuidelineButton({ g, isDark }: { g: Guideline; isDark: boolean }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const { url, fileName } = await guidelinesApi.getDownloadUrl(g.id);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = fileName || g.fileName || 'archivo';
      a.click();
    } catch {
      toast.error('No se pudo obtener el enlace de descarga');
    } finally {
      setLoading(false);
    }
  };

  const FileIcon_ = g.fileMimeType?.includes('pdf')
    ? FileText
    : g.fileMimeType?.includes('presentation') || g.fileMimeType?.includes('powerpoint')
      ? Presentation
      : FileIcon;

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${isDark
          ? 'bg-primary-800 text-primary-200 hover:bg-primary-700'
          : 'bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100'
        }`}
    >
      {loading ? <Loader2 size={16} className="animate-spin flex-shrink-0" /> : <FileIcon_ size={16} className="flex-shrink-0" />}
      {loading ? <Loader2 size={14} className="animate-spin flex-shrink-0" /> : <Download size={14} className="flex-shrink-0" />}
      <span>{loading ? 'Generando enlace...' : `Descargar ${g.fileName ?? 'archivo adjunto'}`}</span>
    </button>
  );
}

const ICON_MAP: Record<string, React.ReactNode> = {
  FileText: <FileText size={22} />,
  AlignLeft: <AlignLeft size={22} />,
  Image: <Image size={22} />,
  Shield: <Shield size={22} />,
  Upload: <Upload size={22} />,
  CheckCircle: <CheckCircle size={22} />,
  Award: <Award size={22} />,
  Book: <Book size={22} />,
};

export default function Guidelines() {
  const { isDark } = useTheme();
  useScrollToTop(); // Scroll automático al principio de la página
  const bg = isDark ? 'bg-gray-950' : 'bg-white';
  const bgAlt = isDark ? 'bg-gray-900' : 'bg-[#F5EDD8]';
  const text = isDark ? 'text-gray-100' : 'text-gray-900';
  const textMut = isDark ? 'text-gray-400' : 'text-gray-500';
  const green = isDark ? 'text-primary-400' : 'text-primary-700';
  const heading = isDark ? 'text-white' : 'text-primary-900';
  const divider = isDark ? 'bg-primary-500' : 'bg-primary-600';
  const card = isDark ? 'bg-gray-800 border-white/10' : 'bg-white border-gray-100';

  const { data: event } = useQuery({ queryKey: ['event-active'], queryFn: eventsApi.getActive });
  const { data: guidelines, isLoading } = useQuery({
    queryKey: ['guidelines', event?.id],
    queryFn: () => guidelinesApi.getPublic(event!.id),
    enabled: !!event?.id,
  });

  const categoryLabels: Record<string, string> = {
    format: 'Formato',
    submission: 'Envío',
    evaluation: 'Evaluación',
    publication: 'Publicación',
    general: 'General',
  };

  const categoryColors: Record<string, string> = isDark
    ? {
      format: 'bg-blue-900/50 text-blue-300',
      submission: 'bg-green-900/50 text-green-300',
      evaluation: 'bg-yellow-900/50 text-yellow-300',
      publication: 'bg-purple-900/50 text-purple-300',
      general: 'bg-gray-700 text-gray-300',
    }
    : {
      format: 'bg-blue-100 text-blue-800',
      submission: 'bg-green-100 text-green-800',
      evaluation: 'bg-yellow-100 text-yellow-800',
      publication: 'bg-purple-100 text-purple-800',
      general: 'bg-gray-100 text-gray-800',
    };

  return (
    <div className={`min-h-screen ${bg}`}>
      {/* Hero */}
      <div className={`py-16 relative overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-primary-700'}`}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full border border-white/10" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full border border-white/5" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <span className={`text-[11px] font-bold uppercase tracking-[0.2em] block mb-3 ${isDark ? 'text-primary-400' : 'text-primary-200'}`}>
            II Simposio Internacional de Ciencia Abierta
          </span>
          <h1 className="font-heading font-black text-4xl md:text-5xl text-white mb-3">Pautas de Publicación</h1>
          <div className="w-16 h-1 bg-amber-500 rounded-full mx-auto mb-4" />
          <p className={`max-w-2xl mx-auto text-base ${isDark ? 'text-gray-400' : 'text-primary-100'}`}>
            Requisitos y normas para la presentación de trabajos científicos en el {event?.name}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`${card} rounded-xl border p-6 animate-pulse`}>
                <div className={`h-5 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/3 mb-3`} />
                <div className={`h-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded w-full mb-2`} />
                <div className={`h-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded w-5/6`} />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {guidelines?.map((g, i) => (
              <div
                key={g.id}
                className={`${card} rounded-xl shadow-sm border overflow-hidden animate-fade-in-up`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className={`flex items-center gap-4 p-6 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                  {/* Numbered badge */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${isDark ? 'bg-primary-700 text-primary-200' : 'bg-primary-100 text-primary-700'}`}>
                    {i + 1}
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-primary-900/50 text-primary-400' : 'bg-primary-100 text-primary-600'}`}>
                    {g.iconName && ICON_MAP[g.iconName] ? ICON_MAP[g.iconName] : <FileText size={22} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className={`font-heading font-semibold text-lg ${text}`}>{g.title}</h3>
                      <span className={`badge text-xs ${categoryColors[g.category]}`}>
                        {categoryLabels[g.category]}
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  className={`p-6 text-sm leading-relaxed prose prose-sm max-w-none ${textMut} ${isDark ? 'prose-invert' : ''}`}
                  dangerouslySetInnerHTML={{ __html: g.content }}
                />
                {/* Archivo adjunto descargable */}
                {g.fileUrl && (
                  <div className={`px-6 pb-6`}>
                    <DownloadGuidelineButton g={g} isDark={isDark} />
                  </div>
                )}
              </div>
            ))}

            {!guidelines?.length && !isLoading && (
              <div className={`text-center py-12 ${textMut}`}>
                No hay pautas disponibles en este momento.
              </div>
            )}
          </div>
        )}

        {/* Bottom CTA */}
        <div className={`mt-12 rounded-2xl p-8 text-center border ${isDark ? 'bg-primary-900/20 border-primary-800' : 'bg-primary-50 border-primary-200'}`}>
          <h3 className={`font-heading font-bold text-xl mb-2 ${isDark ? 'text-primary-300' : 'text-primary-800'}`}>
            ¿Listo para postular?
          </h3>
          <p className={`mb-4 ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
            Si ya revisó todas las pautas, puede enviar su trabajo científico.
          </p>
          <a href="/postular" className="btn-primary inline-block cursor-pointer text-white">
            Postular mi Trabajo
          </a>
        </div>
      </div>
    </div>
  );
}
