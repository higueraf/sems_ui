import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CheckCircle, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { portalApi } from '../../api/portal.api';
import { eventsApi } from '../../api/events.api';
import { useAuthStore } from '../../store/auth.store';
import SubmissionForm from '../../components/portal/SubmissionForm';
import SubmissionManagePanel from '../../components/portal/SubmissionManagePanel';

export default function PortalDashboard() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: activeEvent } = useQuery({ queryKey: ['event-active'], queryFn: eventsApi.getActive });

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['portal-submissions'],
    queryFn: portalApi.getMySubmissions,
  });

  const currentSummary = activeEvent
    ? submissions.find((s) => s.event?.id === activeEvent.id)
    : undefined;

  const { data: currentSubmission, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ['portal-submission', currentSummary?.id],
    queryFn: () => portalApi.getMySubmission(currentSummary!.id),
    enabled: !!currentSummary?.id,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['portal-submissions'] });
    if (currentSummary?.id) {
      qc.invalidateQueries({ queryKey: ['portal-submission', currentSummary.id] });
    }
  };

  if (isLoading || (currentSummary && isLoadingCurrent)) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-[#007F3A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Ya postuló al evento activo: mostrar panel de gestión de esa postulación
  if (currentSubmission) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">Postulación actual</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeEvent?.name} — gestiona el estado, tus documentos y los datos de tu trabajo.
          </p>
        </div>
        <SubmissionManagePanel submission={currentSubmission} onUpdated={refresh} />
      </div>
    );
  }

  // No ha postulado aún al evento activo: mostrar formulario de postulación
  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Nueva postulación</h1>
          <p className="text-sm text-gray-500 mt-1">
            Aún no has postulado a {activeEvent?.name ?? 'el simposio actual'}. Completa el formulario para enviar tu trabajo.
          </p>
        </div>
        {submissions.length > 0 && (
          <Link
            to="/portal/postulaciones"
            className="flex items-center gap-1.5 text-sm font-medium text-[#007F3A] hover:underline shrink-0"
          >
            <Layers size={15} /> Ver mis postulaciones anteriores
          </Link>
        )}
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
          qc.invalidateQueries({ queryKey: ['portal-submissions'] });
        }}
      />
    </div>
  );
}
