import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search, Filter, Eye, ChevronDown, ChevronUp, ChevronsUpDown,
  Mail, X, Send, AlertTriangle, CheckCircle, Loader2, Download, Users, ArrowLeft, FileText,
} from 'lucide-react';
import RichTextEditor from '../../components/ui/RichTextEditor';
import EventPicker from '../../components/dashboard/EventPicker';
import { eventsApi } from '../../api/events.api';
import { submissionsApi, UniqueAuthor } from '../../api/submissions.api';
import { thematicAxesApi, productTypesApi, countriesApi, universitiesApi, facultiesApi } from '../../api/index';
import { Submission } from '../../types';
import { STATUS_CONFIG, formatDate, getFileUrl } from '../../utils';

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

// ─── Modal de correo masivo ───────────────────────────────────────────────────
function BulkEmailModal({
  eventId,
  totalAll,
  onClose,
}: {
  eventId: string;
  totalAll: number;
  onClose: () => void;
}) {
  const [filterStatus, setFilterStatus] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ queued: number; message: string } | null>(null);
  const [error, setError] = useState('');

  // Calcular cuántos recibirán el correo según el filtro seleccionado
  const { data: previewData } = useQuery({
    queryKey: ['submissions-count', eventId, filterStatus],
    queryFn: () =>
      submissionsApi.getAll({
        eventId,
        status: filterStatus || undefined,
      }),
  });
  const recipientCount = previewData?.length ?? 0;

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      setError('El asunto y el cuerpo del correo son obligatorios.');
      return;
    }
    if (recipientCount === 0) {
      setError('No hay destinatarios para el filtro seleccionado.');
      return;
    }
    setError('');
    setSending(true);
    try {
      const res = await submissionsApi.sendBulkEmail({
        subject,
        body,
        eventId,
        status: filterStatus || undefined,
      });
      setResult(res);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error al iniciar el envío masivo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center">
              <Mail size={18} className="text-primary-600" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-gray-900 text-lg">Envío Masivo de Correos</h2>
              <p className="text-xs text-gray-500">Los correos se despachan en segundo plano</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Resultado exitoso */}
          {result ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">¡Envío iniciado!</p>
                <p className="text-gray-500 text-sm mt-1">{result.message}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-sm text-white font-medium">
                {result.queued} correo{result.queued !== 1 ? 's' : ''} en cola de despacho
              </div>
              <p className="text-xs text-gray-400">
                Puedes cerrar esta ventana. Los correos se envían automáticamente en segundo plano con un intervalo de 300ms entre cada uno.
              </p>
              <button onClick={onClose} className="btn-primary">
                Cerrar
              </button>
            </div>
          ) : (
            <>
              {/* Filtro de destinatarios */}
              <div>
                <label className="form-label">Destinatarios</label>
                <div className="relative">
                  <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="form-input pl-9 py-2.5 text-sm appearance-none"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.value === '' ? `Todos los postulantes (${totalAll})` : opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                {/* Contador de destinatarios */}
                <div className={`mt-2 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2
                  ${recipientCount === 0
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-primary-50 text-primary-700'
                  }`}>
                  <Mail size={14} />
                  {recipientCount === 0
                    ? 'Sin destinatarios para este filtro'
                    : `${recipientCount} postulante${recipientCount !== 1 ? 's' : ''} recibirán este correo`
                  }
                </div>
              </div>

              {/* Asunto */}
              <div>
                <label className="form-label">Asunto <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ej: Actualización importante sobre su postulación"
                  className="form-input py-2.5 text-sm"
                />
              </div>

              {/* Cuerpo WYSIWYG */}
              <div>
                <label className="form-label">
                  Mensaje <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs font-normal text-gray-400">(negrita, listas, alineación, colores, etc.)</span>
                </label>
                <RichTextEditor
                  value={body}
                  onChange={setBody}
                  placeholder="Redacte aquí el mensaje para los postulantes..."
                  minHeight={200}
                />
                <p className="text-xs text-gray-400 mt-1">
                  El mensaje se integrará en la plantilla HTML oficial del simposio.
                </p>
              </div>

              {/* Advertencia antes de enviar */}
              {recipientCount > 10 && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700">
                    Vas a enviar <strong>{recipientCount} correos</strong>. Esta acción no se puede deshacer.
                    El envío tardará aproximadamente{' '}
                    <strong>{Math.ceil((recipientCount * 0.3) / 60)} min</strong> en completarse.
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                  <AlertTriangle size={15} />
                  {error}
                </div>
              )}

              {/* Acciones */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  onClick={onClose}
                  className="btn-secondary"
                  disabled={sending}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending || recipientCount === 0}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Iniciando...
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      Enviar a {recipientCount} postulante{recipientCount !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── Pestaña de autores únicos ────────────────────────────────────────────────
function UniqueAuthorsTab({ eventId }: { eventId?: string }) {
  // El autor seleccionado y el texto de búsqueda viven en la URL: así, al
  // entrar a una de sus postulaciones y volver, se regresa exactamente a
  // este mismo autor (y no a la lista completa).
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const search = params.get('authorSearch') || '';
  const setSearch = (v: string) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (v) next.set('authorSearch', v); else next.delete('authorSearch');
      return next;
    }, { replace: true });
  };

  const authorKey = params.get('authorKey') || '';
  const selectAuthor = (a: UniqueAuthor) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('authorKey', a.key);
      return next;
    }); // push: permite volver con el botón "Atrás" del navegador
  };

  const { data: authors, isLoading } = useQuery({
    queryKey: ['submissions-authors', eventId],
    queryFn: () => submissionsApi.getUniqueAuthors(eventId!),
    enabled: !!eventId,
  });

  const selected = authors?.find((a) => a.key === authorKey) ?? null;

  const q = search.trim().toLowerCase();
  const filtered = (authors ?? []).filter((a) =>
    !q || a.fullName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q),
  );

  // Vista de detalle: postulaciones de un autor seleccionado
  if (selected) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:underline mb-4 cursor-pointer"
        >
          <ArrowLeft size={15} /> Volver a autores únicos
        </button>

        <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
          <div>
            <h2 className="font-heading font-bold text-lg text-gray-900">{selected.fullName}</h2>
            <p className="text-sm text-gray-500">{selected.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {selected.universityName ?? 'Sin institución'} {selected.countryName ? `· ${selected.countryName}` : ''}
            </p>
          </div>
          <span className="badge bg-blue-100 text-blue-700 text-sm">
            {selected.submissionCount} postulaci{selected.submissionCount === 1 ? 'ón' : 'ones'}
          </span>
        </div>

        <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
          {selected.submissions.map((sub) => {
            const cfg = STATUS_CONFIG[sub.status];
            return (
              <Link
                key={sub.id}
                to={`/dashboard/postulaciones/${sub.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs text-primary-600 font-semibold">{sub.referenceCode}</p>
                  <p className="text-sm font-medium text-gray-800 line-clamp-1">{sub.titleEs}</p>
                  <p className="text-xs text-gray-400">{formatDate(sub.createdAt)}</p>
                </div>
                <span className={`badge shrink-0 ${cfg?.bgColor} ${cfg?.textColor}`}>
                  {cfg?.label ?? sub.status}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // Vista de lista: autores únicos del evento
  return (
    <div className="space-y-4">
      <div className="card !p-4">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar autor por nombre o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9 py-2.5 text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Autor</th>
                  <th className="table-th">Institución</th>
                  <th className="table-th">País</th>
                  <th className="table-th">Postulaciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="table-td text-center text-gray-400 py-10">
                      No se encontraron autores
                    </td>
                  </tr>
                ) : (
                  filtered.map((a) => (
                    <tr
                      key={a.key}
                      onClick={() => selectAuthor(a)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="table-td">
                        <p className="font-medium text-gray-900 text-sm">{a.fullName}</p>
                        <p className="text-xs text-gray-400">{a.email}</p>
                      </td>
                      <td className="table-td text-sm text-gray-600">{a.universityName ?? '—'}</td>
                      <td className="table-td text-sm text-gray-600">{a.countryName ?? '—'}</td>
                      <td className="table-td">
                        <span className="badge bg-blue-100 text-blue-700 text-xs flex items-center gap-1 w-fit">
                          <FileText size={11} /> {a.submissionCount}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Submissions() {
  const [params, setParams] = useSearchParams();

  // Todos los filtros/estado de esta vista viven en la URL, para que al
  // entrar a una postulación (o a un autor y luego a su postulación) y
  // volver, se conserven exactamente como estaban.
  const updateParams = (
    updates: Record<string, string | number | undefined>,
    options?: { push?: boolean },
  ) => {
    // Forma funcional: evita perder cambios si dos actualizaciones ocurren
    // en el mismo tick (cada una partiría de los searchParams ya vigentes).
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(updates)) {
        if (v === undefined || v === '') next.delete(k);
        else next.set(k, String(v));
      }
      if (!('page' in updates)) next.delete('page'); // cualquier cambio de filtro regresa a la página 1
      return next;
    }, { replace: !options?.push });
  };

  const activeTab = (params.get('tab') as 'list' | 'authors') || 'list';
  const setActiveTab = (t: 'list' | 'authors') => updateParams({ tab: t === 'list' ? undefined : t });
  const search = params.get('search') || '';
  const setSearch = (v: string) => updateParams({ search: v });
  const status = params.get('status') || '';
  const setStatus = (v: string) => updateParams({ status: v });
  const axisId = params.get('axisId') || '';
  const setAxisId = (v: string) => updateParams({ axisId: v });
  const productTypeId = params.get('productTypeId') || '';
  const setProductTypeId = (v: string) => updateParams({ productTypeId: v });
  const countryId = params.get('countryId') || '';
  const setCountryId = (v: string) => updateParams({ countryId: v, universityId: undefined, facultyId: undefined });
  const universityId = params.get('universityId') || '';
  const setUniversityId = (v: string) => updateParams({ universityId: v, facultyId: undefined });
  const facultyId = params.get('facultyId') || '';
  const setFacultyId = (v: string) => updateParams({ facultyId: v });
  const [showBulkModal, setShowBulkModal] = useState(false);
  const page = Number(params.get('page')) || 1;
  const setPage = (p: number) => updateParams({ page: p });
  const pageSize = Number(params.get('pageSize')) || 20;
  const setPageSize = (n: number) => updateParams({ pageSize: n });
  const sortBy = (params.get('sortBy') as 'name' | 'title' | 'date') || 'date';
  const sortDir = (params.get('sortDir') as 'asc' | 'desc') || 'desc';

  const { data: activeEvent } = useQuery({ queryKey: ['event-active'], queryFn: eventsApi.getActive });
  const [eventId, setEventIdState] = useState<string | undefined>(params.get('eventId') || undefined);
  const setEventId = (id: string) => { setEventIdState(id); updateParams({ eventId: id }); };

  // Por defecto se muestra el evento activo, pero el admin puede cambiarlo
  // para consultar postulaciones de ediciones anteriores.
  useEffect(() => {
    if (!eventId && activeEvent?.id) {
      setEventIdState(activeEvent.id);
      updateParams({ eventId: activeEvent.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEvent, eventId]);

  const { data: axes } = useQuery({
    queryKey: ['axes-admin', eventId],
    queryFn: () => thematicAxesApi.getAll(eventId!),
    enabled: !!eventId,
  });
  const { data: productTypes } = useQuery({
    queryKey: ['product-types'],
    queryFn: () => productTypesApi.getAll(true),
  });
  const { data: countries } = useQuery({
    queryKey: ['countries'],
    queryFn: () => countriesApi.getAll(),
  });
  const { data: universities } = useQuery({
    queryKey: ['universities', countryId],
    queryFn: () => universitiesApi.getAll({ countryId: countryId || undefined }),
  });
  const { data: faculties } = useQuery({
    queryKey: ['faculties', universityId],
    queryFn: () => facultiesApi.getAll({ universityId }),
    enabled: !!universityId,
  });
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['submissions', eventId, status, axisId, productTypeId, search, countryId, universityId, facultyId],
    queryFn: () =>
      submissionsApi.getAll({
        eventId,
        status: status || undefined,
        thematicAxisId: axisId || undefined,
        productTypeId: productTypeId || undefined,
        search: search || undefined,
        countryId: countryId || undefined,
        universityId: universityId || undefined,
        facultyId: facultyId || undefined,
      }),
    enabled: !!eventId,
  });

  // Total sin filtro para mostrar en el modal
  const { data: allSubmissions } = useQuery({
    queryKey: ['submissions-all', eventId],
    queryFn: () => submissionsApi.getAll({ eventId }),
    enabled: !!eventId,
  });

  const handleExportCsv = () => {
    const rows = sortedSubmissions;
    if (rows.length === 0) return;

    const headers = [
      'Código', 'Título', 'Eje Temático', 'Tipo de Producción',
      'Estado Global', 'Fecha Postulación',
      'Orden', 'Nombre Autor', 'Email', 'Institución', 'País', 'Correspondiente', 'Ponente',
    ];

    const lines: string[] = [headers.map(h => `"${h}"`).join(',')];

    for (const sub of rows) {
      const statusLabel = STATUS_CONFIG[sub.status]?.label ?? sub.status;
      const allIds = sub.productTypeIds && sub.productTypeIds.length > 0
        ? sub.productTypeIds
        : (sub.productType?.id ? [sub.productType.id] : []);
      // Tipo de producción: usar nombre del productType principal
      const ptName = sub.productType?.name ?? allIds.join(' / ');
      const date = formatDate(sub.createdAt);

      const authors = sub.authors.length > 0 ? sub.authors : [null];
      for (const author of authors) {
        const cell = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`;
        lines.push([
          cell(sub.referenceCode),
          cell(sub.titleEs),
          cell(sub.thematicAxis?.name ?? ''),
          cell(ptName),
          cell(statusLabel),
          cell(date),
          author ? String(author.authorOrder + 1) : '',
          author ? cell(author.fullName) : '""',
          author ? cell(author.email) : '""',
          author ? cell(author.university?.name ?? author.affiliation ?? '') : '""',
          author ? cell(author.country?.name ?? '') : '""',
          author ? (author.isCorresponding ? '"Sí"' : '"No"') : '""',
          author ? (author.isPresenter ? '"Sí"' : '"No"') : '""',
        ].join(','));
      }
    }

    const csv = '\ufeff' + lines.join('\r\n'); // BOM para Excel
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `postulaciones_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSort = (col: 'name' | 'title' | 'date') => {
    if (sortBy === col) updateParams({ sortDir: sortDir === 'asc' ? 'desc' : 'asc' });
    else updateParams({ sortBy: col, sortDir: 'asc' });
  };

  const sortedSubmissions = [...(submissions ?? [])].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'name') {
      const nameA = (a.authors.find(x => x.isCorresponding) || a.authors[0])?.fullName ?? '';
      const nameB = (b.authors.find(x => x.isCorresponding) || b.authors[0])?.fullName ?? '';
      cmp = nameA.localeCompare(nameB, 'es');
    } else if (sortBy === 'title') {
      cmp = (a.titleEs ?? '').localeCompare(b.titleEs ?? '', 'es');
    } else {
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sortedSubmissions.length / pageSize));
  const submissionsPage = sortedSubmissions.slice((page - 1) * pageSize, page * pageSize);

  // Cada setter de filtro ya regresa a la página 1 por sí mismo (ver updateParams).
  const handleFilterChange = (fn: () => void) => fn();

  const SortIcon = ({ col }: { col: 'name' | 'title' | 'date' }) => {
    if (sortBy !== col) return <ChevronsUpDown size={13} className="text-gray-400 ml-1 inline" />;
    return sortDir === 'asc'
      ? <ChevronUp size={13} className="text-primary-600 ml-1 inline" />
      : <ChevronDown size={13} className="text-primary-600 ml-1 inline" />;
  };

  return (
    <div className="space-y-5">
      {/* Modal de envío masivo */}
      {showBulkModal && eventId && (
        <BulkEmailModal
          eventId={eventId}
          totalAll={allSubmissions?.length ?? 0}
          onClose={() => setShowBulkModal(false)}
        />
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-heading font-bold text-2xl text-gray-900">Postulaciones</h1>
        <div className="flex items-center gap-3">
          {/* Selector de evento */}
          <EventPicker value={eventId} onChange={(id) => setEventId(id)} />
          {/* Botón exportar CSV */}
          <button
            onClick={handleExportCsv}
            disabled={!sortedSubmissions.length}
            className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-50"
            title="Exportar lista de postulaciones con autores"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          {/* Botón de correo masivo */}
          <button
            onClick={() => setShowBulkModal(true)}
            className="btn-secondary flex items-center gap-2 text-sm "
            title="Enviar correo masivo a postulantes"
          >
            <Mail size={15} />
            <span className="hidden sm:inline">Correo masivo</span>
          </button>
          <span className="badge bg-blue-100 text-blue-700 text-sm">
            {submissions?.length ?? 0} {(submissions?.length ?? 0) === 1 ? 'registro' : 'registros'}
          </span>
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {[
          { key: 'list' as const, label: 'Postulaciones', icon: FileText },
          { key: 'authors' as const, label: 'Autores Únicos', icon: Users },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === tab.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'authors' ? (
        <UniqueAuthorsTab eventId={eventId} />
      ) : (
      <>
      {/* Filters */}
      <div className="card !p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, código, autor..."
              value={search}
              onChange={(e) => handleFilterChange(() => setSearch(e.target.value))}
              className="form-input pl-9 py-2.5 text-sm"
            />
          </div>
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={status}
              onChange={(e) => handleFilterChange(() => setStatus(e.target.value))}
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
              value={productTypeId}
              onChange={(e) => handleFilterChange(() => setProductTypeId(e.target.value))}
              className="form-input py-2.5 text-sm appearance-none"
            >
              <option value="">Todos los tipos de producción</option>
              {productTypes?.map((pt) => (
                <option key={pt.id} value={pt.id}>{pt.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={axisId}
              onChange={(e) => handleFilterChange(() => setAxisId(e.target.value))}
              className="form-input py-2.5 text-sm appearance-none"
            >
              <option value="">Todos los ejes</option>
              {axes?.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={countryId}
              onChange={(e) => handleFilterChange(() => setCountryId(e.target.value))}
              className="form-input py-2.5 text-sm appearance-none"
            >
              <option value="">Todos los países</option>
              {countries?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={universityId}
              onChange={(e) => handleFilterChange(() => setUniversityId(e.target.value))}
              className="form-input py-2.5 text-sm appearance-none"
            >
              <option value="">Todas las universidades</option>
              {universities?.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={facultyId}
              onChange={(e) => handleFilterChange(() => setFacultyId(e.target.value))}
              disabled={!universityId}
              className="form-input py-2.5 text-sm appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Todas las facultades</option>
              {faculties?.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
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
          <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Código</th>
                  <th className="table-th cursor-pointer select-none hover:text-primary-600" onClick={() => handleSort('title')}>
                    Título<SortIcon col="title" />
                  </th>
                  <th className="table-th">Eje Temático</th>
                  <th className="table-th cursor-pointer select-none hover:text-primary-600" onClick={() => handleSort('name')}>
                    Autores<SortIcon col="name" />
                  </th>
                  <th className="table-th">Estado</th>
                  <th className="table-th cursor-pointer select-none hover:text-primary-600" onClick={() => handleSort('date')}>
                    Fecha<SortIcon col="date" />
                  </th>
                  <th className="table-th">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {submissionsPage.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="table-td text-center text-gray-400 py-10">
                      No se encontraron postulaciones
                    </td>
                  </tr>
                ) : (
                  submissionsPage.map((sub: Submission) => {
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
                            <div className="flex items-center gap-1">
                              {corresponding?.country && (
                                <span className="text-base">{corresponding.country.flagEmoji}</span>
                              )}
                              {corresponding?.university?.logoUrl && (
                                <img
                                  src={getFileUrl(corresponding.university.logoUrl)}
                                  alt={corresponding.university.name}
                                  title={corresponding.university.name}
                                  className="w-7 h-7 object-contain rounded bg-white border border-gray-200"
                                />
                              )}
                            </div>
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
                            className="btn-primary btn-sm flex items-center gap-1 !py-1.5 text-white"
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
          {/* Pagination */}
          {(submissions?.length ?? 0) > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-400">
                  Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sortedSubmissions.length)} de {sortedSubmissions.length}
                </p>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  {[20, 30, 40, 50].map((n) => (
                    <option key={n} value={n}>{n} por página</option>
                  ))}
                </select>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(page - 1)} disabled={page === 1}
                    className="px-2.5 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">‹</button>
                  {(() => {
                    const pages: (number | '...')[] = [];
                    if (totalPages <= 7) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else {
                      pages.push(1);
                      if (page > 3) pages.push('...');
                      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
                      if (page < totalPages - 2) pages.push('...');
                      pages.push(totalPages);
                    }
                    return pages.map((p, i) =>
                      p === '...'
                        ? <span key={`d${i}`} className="px-1.5 text-gray-400 text-sm">…</span>
                        : <button key={p} onClick={() => setPage(p as number)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${page === p ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                            {p}
                          </button>
                    );
                  })()}
                  <button onClick={() => setPage(page + 1)} disabled={page === totalPages}
                    className="px-2.5 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">›</button>
                </div>
              )}
            </div>
          )}
          </>
        )}
      </div>
      </>
      )}
    </div>
  );
}
