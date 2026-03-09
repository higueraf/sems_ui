import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Eye, ChevronDown } from 'lucide-react';
import { eventsApi } from '../../api/events.api';
import { submissionsApi } from '../../api/submissions.api';
import { thematicAxesApi } from '../../api/index';
import { Submission, SubmissionStatus } from '../../types';
import { STATUS_CONFIG, formatDate } from '../../utils';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'received', label: 'Recibidas' },
  { value: 'under_review', label: 'En Revisión' },
  { value: 'revision_requested', label: 'Revisión Requerida' },
  { value: 'approved', label: 'Aprobadas' },
  { value: 'rejected', label: 'Rechazadas' },
  { value: 'withdrawn', label: 'Retiradas' },
  { value: 'scheduled', label: 'Programadas' },
];

export default function Submissions() {
  const [params] = useSearchParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(params.get('status') || '');
  const [axisId, setAxisId] = useState('');

  const { data: event } = useQuery({ queryKey: ['event-active'], queryFn: eventsApi.getActive });
  const { data: axes } = useQuery({
    queryKey: ['axes-admin', event?.id],
    queryFn: () => thematicAxesApi.getAll(event!.id),
    enabled: !!event?.id,
  });
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['submissions', event?.id, status, axisId, search],
    queryFn: () =>
      submissionsApi.getAll({
        eventId: event?.id,
        status: status || undefined,
        thematicAxisId: axisId || undefined,
        search: search || undefined,
      }),
    enabled: !!event?.id,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl text-gray-900">Postulaciones</h1>
        <span className="badge bg-blue-100 text-blue-700 text-sm">
          {submissions?.length ?? 0} registros
        </span>
      </div>

      {/* Filters */}
      <div className="card !p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, código, autor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-9 py-2.5 text-sm"
            />
          </div>
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="form-input pl-9 py-2.5 text-sm appearance-none"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={axisId}
              onChange={(e) => setAxisId(e.target.value)}
              className="form-input py-2.5 text-sm appearance-none"
            >
              <option value="">Todos los ejes</option>
              {axes?.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Código</th>
                  <th className="table-th">Título</th>
                  <th className="table-th">Eje Temático</th>
                  <th className="table-th">Autores</th>
                  <th className="table-th">Estado</th>
                  <th className="table-th">Fecha</th>
                  <th className="table-th">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {submissions?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="table-td text-center text-gray-400 py-10">
                      No se encontraron postulaciones
                    </td>
                  </tr>
                ) : (
                  submissions?.map((sub: Submission) => {
                    const cfg = STATUS_CONFIG[sub.status];
                    const corresponding = sub.authors.find((a) => a.isCorresponding) || sub.authors[0];
                    return (
                      <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                        <td className="table-td">
                          <span className="font-mono text-xs text-primary-600 font-semibold">
                            {sub.referenceCode}
                          </span>
                        </td>
                        <td className="table-td max-w-xs">
                          <p className="font-medium text-gray-900 line-clamp-2 text-sm leading-tight">
                            {sub.titleEs}
                          </p>
                        </td>
                        <td className="table-td">
                          <span
                            className="badge text-white text-xs"
                            style={{ backgroundColor: sub.thematicAxis?.color || '#888' }}
                          >
                            {sub.thematicAxis?.name || '—'}
                          </span>
                        </td>
                        <td className="table-td">
                          <div className="text-sm">
                            <p className="font-medium text-gray-700">{corresponding?.fullName}</p>
                            {sub.authors.length > 1 && (
                              <p className="text-xs text-gray-400">+{sub.authors.length - 1} más</p>
                            )}
                            {corresponding?.country && (
                              <span className="text-base">{corresponding.country.flagEmoji}</span>
                            )}
                          </div>
                        </td>
                        <td className="table-td">
                          <span className={`badge ${cfg?.bgColor} ${cfg?.textColor}`}>
                            {cfg?.label || sub.status}
                          </span>
                        </td>
                        <td className="table-td text-gray-500 text-xs whitespace-nowrap">
                          {formatDate(sub.createdAt)}
                        </td>
                        <td className="table-td">
                          <Link
                            to={`/dashboard/postulaciones/${sub.id}`}
                            className="btn-primary btn-sm flex items-center gap-1 !py-1.5"
                          >
                            <Eye size={14} />
                            Ver
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
