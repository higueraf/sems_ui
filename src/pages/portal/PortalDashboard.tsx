import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CheckCircle, Layers, Plus, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { portalApi } from '../../api/portal.api';
import { eventsApi } from '../../api/events.api';
import { useAuthStore } from '../../store/auth.store';
import { STATUS_CONFIG, formatDate } from '../../utils';
import SubmissionForm from '../../components/portal/SubmissionForm';

export default function PortalDashboard() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  // Un usuario puede enviar varias postulaciones independientes al mismo evento;
  // este flag fuerza mostrar el formulario aunque ya existan postulaciones previas.
  const [showForm, setShowForm] = useState(false);

  const { data: activeEvent } = useQuery({ queryKey: ['event-active'], queryFn: eventsApi.getActive });

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['portal-submissions'],
    queryFn: portalApi.getMySubmissions,
  });

  const eventSubmissions = activeEvent
    ? submissions.filter((s) => s.event?.id === activeEvent.id)
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-[#007F3A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Ya tiene una o más postulaciones al evento activo: listarlas, con opción de enviar otra.
  if (eventSubmissions.length > 0 && !showForm) {
    return (
      <div>
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Mis postulaciones</h1>
            <p className="text-sm text-gray-500 mt-1">
              {activeEvent?.name} — gestiona el estado, tus documentos y los datos de tus trabajos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="btn-primary cursor-pointer text-white flex items-center gap-1.5 shrink-0"
          >
            <Plus size={16} /> Postular otro trabajo
          </button>
        </div>

        <div className="space-y-3">
          {eventSubmissions.map((s) => {
            const cfg = STATUS_CONFIG[s.status as keyof typeof STATUS_CONFIG];
            return (
              <Link
                key={s.id}
                to={`/portal/postulacion/${s.id}`}
                className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-[#007F3A]/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1">{s.titleEs}</p>
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
    );
  }

  // No ha postulado aún al evento activo (o eligió postular otro trabajo): mostrar formulario
  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Nueva postulación</h1>
          <p className="text-sm text-gray-500 mt-1">
            {eventSubmissions.length > 0
              ? `Completa el formulario para enviar otro trabajo a ${activeEvent?.name ?? 'el simposio actual'}.`
              : `Aún no has postulado a ${activeEvent?.name ?? 'el simposio actual'}. Completa el formulario para enviar tu trabajo.`}
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {eventSubmissions.length > 0 && (
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm font-medium text-gray-500 hover:underline cursor-pointer"
            >
              Cancelar
            </button>
          )}
          {submissions.length > 0 && (
            <Link
              to="/portal/postulaciones"
              className="flex items-center gap-1.5 text-sm font-medium text-[#007F3A] hover:underline"
            >
              <Layers size={15} /> Ver mis postulaciones anteriores
            </Link>
          )}
        </div>
      </div>

      <SubmissionForm
        defaultAuthor={user ? { fullName: `${user.firstName} ${user.lastName}`, email: user.email } : undefined}
        onSuccess={(referenceCode) => {
          toast.success(
            <span className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              Postulación enviada — código {referenceCode}
            </span>,
            { duration: 6000 },
          );
          setShowForm(false);
          qc.invalidateQueries({ queryKey: ['portal-submissions'] });
        }}
      />
    </div>
  );
}
