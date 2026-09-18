import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FileText, Clock } from 'lucide-react';
import { portalApi } from '../../api/portal.api';
import { STATUS_CONFIG, formatDate } from '../../utils';
import type { PortalSubmissionSummary } from '../../types';

export default function PortalSubmissionsList() {
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['portal-submissions'],
    queryFn: portalApi.getMySubmissions,
  });

  const grouped = submissions.reduce<Record<string, PortalSubmissionSummary[]>>((acc, s) => {
    const key = s.event?.name ?? 'Sin evento';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">Mis postulaciones</h1>
        <p className="text-sm text-gray-500 mt-1">
          Historial completo de tus trabajos enviados a todos los simposios.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Cargando…</div>
      ) : submissions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <FileText size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium mb-1">No tienes postulaciones aún</p>
          <p className="text-sm text-gray-400">
            Cuando envíes tu primera postulación aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([eventName, subs]) => (
            <div key={eventName}>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                {eventName}
              </h2>
              <div className="space-y-3">
                {subs.map((s) => {
                  const cfg = STATUS_CONFIG[s.status as keyof typeof STATUS_CONFIG];
                  return (
                    <Link
                      key={s.id}
                      to={`/portal/postulacion/${s.id}`}
                      className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-[#007F3A]/30 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1">
                            {s.titleEs}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">{s.referenceCode}</p>
                        </div>
                        {cfg && (
                          <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bgColor} ${cfg.textColor}`}>
                            {cfg.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
                        <Clock size={11} />
                        <span>Enviada el {formatDate(s.createdAt)}</span>
                        {s.canEdit && (
                          <span className="ml-auto text-[10px] font-semibold text-[#007F3A] bg-[#007F3A]/10 px-2 py-0.5 rounded-full">
                            Editable
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
