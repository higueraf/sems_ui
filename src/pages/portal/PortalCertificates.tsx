import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Award, Download } from 'lucide-react';
import { portalApi } from '../../api/portal.api';
import { formatDate } from '../../utils';

export default function PortalCertificates() {
  const { data: certs = [], isLoading } = useQuery({
    queryKey: ['portal-all-certs'],
    queryFn: portalApi.getAllMyCertificates,
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">Mis certificados</h1>
        <p className="text-sm text-gray-500 mt-1">
          Todos los certificados obtenidos en la plataforma, de todos los simposios.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Cargando…</div>
      ) : certs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <Award size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium mb-1">Aún no tienes certificados</p>
          <p className="text-sm text-gray-400">
            Se emitirán automáticamente cuando tu participación sea certificada.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {certs.map((cert) => (
            <div key={cert.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-800">
                    {cert.productTypeName ?? 'Certificado de participación'}
                  </p>
                  {cert.certificateType === 'peer_reviewer' && (
                    <span className="text-[10px] font-semibold text-[#007F3A] bg-[#e6f5ec] px-2 py-0.5 rounded-full">
                      Par académico
                    </span>
                  )}
                </div>
                {cert.submission && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{cert.submission.titleEs}</p>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {cert.event && (
                    <span className="text-[10px] font-medium text-gray-400">
                      {cert.event.name}{cert.event.year ? ` ${cert.event.year}` : ''}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-300 font-mono">{cert.certificateNumber}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">Emitido: {formatDate(cert.issuedAt)}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {cert.hasFile && (
                  <button
                    onClick={() => downloadCert(cert.id, 'diploma')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white text-xs font-semibold rounded-xl hover:bg-primary-500 transition-colors"
                  >
                    <Download size={12} /> Diploma
                  </button>
                )}
                {cert.hasFileCarta && (
                  <button
                    onClick={() => downloadCert(cert.id, 'carta')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-600 text-white text-xs font-semibold rounded-xl hover:bg-gray-500 transition-colors"
                  >
                    <Download size={12} /> Carta
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
