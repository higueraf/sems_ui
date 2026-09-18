import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { portalApi } from '../../api/portal.api';
import SubmissionManagePanel from '../../components/portal/SubmissionManagePanel';

export default function PortalSubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: submission, isLoading } = useQuery({
    queryKey: ['portal-submission', id],
    queryFn: () => portalApi.getMySubmission(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-[#007F3A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!submission) {
    return <p className="text-gray-500 py-16 text-center">Postulación no encontrada.</p>;
  }

  return (
    <div>
      <Link to="/portal/postulaciones" className="inline-flex items-center gap-1.5 text-sm text-[#007F3A] hover:underline mb-5">
        <ArrowLeft size={14} /> Mis postulaciones
      </Link>

      <SubmissionManagePanel
        submission={submission}
        onUpdated={() => qc.invalidateQueries({ queryKey: ['portal-submission', id] })}
      />
    </div>
  );
}
