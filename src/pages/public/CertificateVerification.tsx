import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Award, CheckCircle, XCircle, Download, Calendar, FileText, User } from 'lucide-react';
import { certificatesApi } from '../../api/certificates.api';
import { useTheme } from '../../hooks/useTheme';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import { formatDate } from '../../utils';

export default function CertificateVerification() {
  const { code } = useParams<{ code: string }>();
  const { isDark } = useTheme();
  useScrollToTop();

  const { data: cert, isLoading, isError } = useQuery({
    queryKey: ['certificate-verify', code],
    queryFn: () => certificatesApi.verify(code!),
    enabled: !!code,
    retry: false,
  });

  const bg      = isDark ? 'bg-gray-950' : 'bg-white';
  const bgAlt   = isDark ? 'bg-gray-900' : 'bg-[#F5EDD8]';
  const text     = isDark ? 'text-gray-100' : 'text-gray-900';
  const textMut  = isDark ? 'text-gray-400' : 'text-gray-500';
  const heading  = isDark ? 'text-white' : 'text-primary-900';
  const card     = isDark ? 'bg-gray-800 border-white/10' : 'bg-white border-gray-100';

  return (
    <div className={`min-h-screen font-body ${bg} ${text}`}>

      {/* Hero */}
      <div className={`relative py-14 overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-primary-700'}`}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full border border-white/10" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full border border-white/5" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <span className={`text-[11px] font-bold uppercase tracking-[0.2em] block mb-3 ${isDark ? 'text-primary-400' : 'text-primary-200'}`}>
            II Simposio Internacional de Ciencia Abierta
          </span>
          <h1 className="font-heading font-black text-4xl text-white mb-2">
            Verificar Certificado
          </h1>
          <div className="w-16 h-1 bg-amber-500 rounded-full mx-auto mb-3" />
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-primary-100'}`}>
            Compruebe la autenticidad de un certificado de participación
          </p>
        </div>
      </div>

      {/* Content */}
      <div className={`py-12 ${bgAlt}`}>
        <div className="max-w-2xl mx-auto px-4">

          {isLoading && (
            <div className="flex flex-col items-center py-16 gap-4">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <p className={`text-sm ${textMut}`}>Verificando certificado...</p>
            </div>
          )}

          {isError && (
            <div className={`rounded-2xl border p-10 text-center ${card}`}>
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <XCircle size={32} className="text-red-500" />
              </div>
              <h2 className={`font-heading font-bold text-xl mb-2 ${heading}`}>Certificado no encontrado</h2>
              <p className={`text-sm ${textMut} mb-4`}>
                El código <span className="font-mono font-bold">{code}</span> no corresponde a ningún certificado válido.
              </p>
              <p className={`text-xs ${textMut}`}>
                Si cree que esto es un error, verifique el código QR del certificado o contáctenos.
              </p>
              <Link to="/" className="inline-block mt-6 text-sm text-primary-600 hover:underline">
                Volver al inicio
              </Link>
            </div>
          )}

          {cert && (
            <div className="space-y-4">

              {/* Badge de validez */}
              <div className={`rounded-2xl border p-6 flex items-center gap-4 ${card}`}>
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={30} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-emerald-700 font-bold text-lg">Certificado Válido</p>
                  <p className={`text-sm ${textMut}`}>Este certificado es auténtico y fue emitido por el comité organizador</p>
                </div>
              </div>

              {/* Detalles del certificado */}
              <div className={`rounded-2xl border shadow-sm ${card}`}>
                {/* Header tipo certificado */}
                <div className="bg-primary-700 rounded-t-2xl p-6 text-center">
                  <Award size={32} className="text-amber-400 mx-auto mb-2" />
                  <p className="text-white font-heading font-bold text-xl">CERTIFICADO DE PARTICIPACIÓN</p>
                  <p className="text-primary-200 text-sm mt-1">N° <span className="font-mono font-bold text-amber-300">{cert.certificateNumber}</span></p>
                </div>

                <div className="p-6 space-y-5">
                  <div className="text-center">
                    <p className={`text-sm ${textMut} mb-1`}>Se certifica que</p>
                    <p className={`font-heading font-bold text-2xl ${heading}`}>{cert.authorName}</p>
                  </div>

                  <div className={`border-t pt-5 space-y-4 ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                    {[
                      {
                        icon: FileText,
                        label: 'Ha presentado la investigación',
                        value: `"${cert.titleEs}"`,
                        valueClass: `italic font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`,
                      },
                      {
                        icon: Award,
                        label: 'Tipo de producción científica',
                        value: cert.productTypeName,
                      },
                      {
                        icon: User,
                        label: 'Evento',
                        value: cert.eventName,
                      },
                      {
                        icon: Calendar,
                        label: 'Fecha de emisión',
                        value: formatDate(cert.issuedAt),
                      },
                    ].map(({ icon: Icon, label, value, valueClass }) => (
                      <div key={label} className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-primary-800/40 text-primary-400' : 'bg-primary-50 text-primary-700'}`}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <p className={`text-xs uppercase tracking-wide font-semibold mb-0.5 ${textMut}`}>{label}</p>
                          <p className={valueClass ?? `font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Código de verificación */}
                  <div className={`rounded-xl p-4 text-center border ${isDark ? 'bg-gray-700 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-xs uppercase tracking-wide font-semibold mb-1 ${textMut}`}>Código de verificación</p>
                    <p className="font-mono font-bold text-lg text-primary-600 tracking-widest">{code}</p>
                  </div>
                </div>
              </div>

              <Link
                to="/"
                className={`block text-center text-sm mt-2 ${textMut} hover:underline`}
              >
                Volver al sitio del simposio
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
