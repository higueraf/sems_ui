import { useQuery } from '@tanstack/react-query';
import { FileText, CheckCircle, Clock, XCircle, Star, CalendarDays, Users } from 'lucide-react';
import { eventsApi } from '../../api/events.api';
import { submissionsApi } from '../../api/submissions.api';
import { useAuthStore } from '../../store/auth.store';
import { formatDate, STATUS_CONFIG } from '../../utils';
import { Link } from 'react-router-dom';
import { SubmissionStatsByProductType } from '../../types';

export default function DashboardHome() {
  const { user } = useAuthStore();
  const { data: event } = useQuery({ queryKey: ['event-active'], queryFn: eventsApi.getActive });
  const { data: stats } = useQuery({
    queryKey: ['submission-stats', event?.id],
    queryFn: () => submissionsApi.getStats(event!.id),
    enabled: !!event?.id,
  });

  const statCards = [
    { label: 'Total Postulaciones', value: stats?.total ?? 0, icon: <FileText size={22} />, color: 'bg-blue-500', to: '/dashboard/postulaciones' },
    { label: 'Recibidas', value: stats?.byStatus?.received ?? 0, icon: <Clock size={22} />, color: 'bg-indigo-500', to: '/dashboard/postulaciones?status=received' },
    { label: 'En Revisión', value: stats?.byStatus?.under_review ?? 0, icon: <Star size={22} />, color: 'bg-purple-500', to: '/dashboard/postulaciones?status=under_review' },
    { label: 'Aprobadas', value: stats?.byStatus?.approved ?? 0, icon: <CheckCircle size={22} />, color: 'bg-green-500', to: '/dashboard/postulaciones?status=approved' },
    { label: 'Rechazadas', value: stats?.byStatus?.rejected ?? 0, icon: <XCircle size={22} />, color: 'bg-red-500', to: '/dashboard/postulaciones?status=rejected' },
    { label: 'Programadas', value: stats?.byStatus?.scheduled ?? 0, icon: <CalendarDays size={22} />, color: 'bg-teal-500', to: '/dashboard/agenda' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-2xl text-gray-900">
          Bienvenido, {user?.firstName}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {event ? `Evento activo: ${event.name}` : 'No hay evento activo configurado'}
        </p>
      </div>

      {/* Event Info */}
      {event && (
        <div className="card bg-gradient-to-r from-primary-500 to-primary-700 text-white">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <p className="text-primary-200 text-sm font-medium mb-1">Evento Activo</p>
              <h2 className="font-heading font-bold text-xl mb-2">{event.name}</h2>
              <div className="flex flex-wrap gap-4 text-sm text-primary-100">
                {event.startDate && (
                  <span className="flex items-center gap-1">
                    <CalendarDays size={14} />
                    {formatDate(event.startDate)} – {formatDate(event.endDate)}
                  </span>
                )}
                {event.city && <span>📍 {event.city}, {event.country}</span>}
                {event.submissionDeadline && (
                  <span>⏳ Cierre: {formatDate(event.submissionDeadline)}</span>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${event.isAgendaPublished ? 'bg-green-400 text-green-900' : 'bg-yellow-400 text-yellow-900'}`}>
                Agenda: {event.isAgendaPublished ? 'Publicada' : 'No publicada'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow group"
          >
            <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center text-white mb-3 group-hover:scale-105 transition-transform`}>
              {card.icon}
            </div>
            <p className="font-heading font-bold text-2xl text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1 leading-tight">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Stats por tipo de producción científica */}
      {stats?.byProductType && stats.byProductType.length > 0 && (
        <div>
          <h2 className="font-heading font-semibold text-gray-800 text-base mb-3">
            Evaluación por tipo de producción científica
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Tipo de producción</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-500">Total</th>
                  {['received','under_review','revision_requested','approved','rejected','scheduled','withdrawn'].map((s) => (
                    <th key={s} className="text-center px-3 py-3">
                      <span className={`badge text-xs ${STATUS_CONFIG[s]?.bgColor ?? 'bg-gray-100'} ${STATUS_CONFIG[s]?.textColor ?? 'text-gray-600'}`}>
                        {STATUS_CONFIG[s]?.label ?? s}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.byProductType.map((pt: SubmissionStatsByProductType) => (
                  <tr key={pt.productTypeId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <Link
                        to={`/dashboard/postulaciones?productTypeId=${pt.productTypeId}`}
                        className="hover:text-primary-600 hover:underline"
                      >
                        {pt.productTypeName}
                      </Link>
                    </td>
                    <td className="text-center px-3 py-3 font-bold text-gray-800">{pt.total}</td>
                    {['received','under_review','revision_requested','approved','rejected','scheduled','withdrawn'].map((s) => (
                      <td key={s} className="text-center px-3 py-3 text-gray-600">
                        {pt.byStatus[s] ? (
                          <Link
                            to={`/dashboard/postulaciones?productTypeId=${pt.productTypeId}&status=${s}`}
                            className="font-semibold hover:text-primary-600"
                          >
                            {pt.byStatus[s]}
                          </Link>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/dashboard/postulaciones" className="card hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Revisar Postulaciones</h3>
              <p className="text-xs text-gray-400">Gestionar trabajos enviados</p>
            </div>
          </div>
        </Link>
        <Link to="/dashboard/agenda" className="card hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 text-white rounded-xl flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
              <CalendarDays size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Construir Agenda</h3>
              <p className="text-xs text-gray-400">Programar presentaciones</p>
            </div>
          </div>
        </Link>
        {user?.role === 'admin' && (
          <Link to="/dashboard/eventos" className="card hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Users size={22} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Configurar Evento</h3>
                <p className="text-xs text-gray-400">Gestionar configuraciones</p>
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
