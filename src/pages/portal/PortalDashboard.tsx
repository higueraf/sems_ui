import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, Clock, LogOut } from 'lucide-react';
import { portalApi } from '../../api/portal.api';
import { eventsApi } from '../../api/events.api';
import { useAuthStore } from '../../store/auth.store';
import { STATUS_CONFIG, formatDate, formatEventDateRange } from '../../utils';
import type { PortalSubmissionSummary } from '../../types';

export default function PortalDashboard() {
  const { user, logout } = useAuthStore();

  const { data: event } = useQuery({ queryKey: ['event-active'], queryFn: eventsApi.getActive });
  const eventName = event?.name || 'Simposio Internacional de Ciencia Abierta';
  const eventDateRange = formatEventDateRange(event?.startDate, event?.endDate);

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
          <span className="text-sm text-[#a0d8b3]">
            {user?.firstName} {user?.lastName}
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-[#a0d8b3] hover:text-white transition-colors"
          >
            <LogOut size={14} />
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">Mis postulaciones</h1>
          <p className="text-sm text-gray-500 mt-1">
            Consulta el estado de tus trabajos y descarga tus certificados.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-gray-400">Cargando…</div>
        ) : submissions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <FileText size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">No tienes postulaciones aún</p>
            <p className="text-sm text-gray-400 mb-4">
              Puedes enviar tu trabajo desde el formulario de postulación.
            </p>
            <Link
              to="/postular"
              className="inline-block px-5 py-2.5 bg-[#007F3A] text-white text-sm font-semibold rounded-xl hover:bg-[#005c2a] transition-colors"
            >
              Postularme ahora
            </Link>
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
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
