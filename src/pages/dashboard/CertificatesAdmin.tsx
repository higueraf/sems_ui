import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Award, Download, Send, Trash2, Search, Filter,
  CheckCircle, Clock, RefreshCw, Loader2,
} from 'lucide-react';
import { certificatesApi } from '../../api/certificates.api';
import { productTypesApi } from '../../api/index';
import { eventsApi } from '../../api/events.api';
import { formatDate } from '../../utils';
import { Certificate } from '../../types';

export default function CertificatesAdmin() {
  const { data: activeEvent } = useQuery({ queryKey: ['event-active'], queryFn: eventsApi.getActive });
  const activeEventId = activeEvent?.id;
  const qc            = useQueryClient();

  const [filterProductType, setFilterProductType] = useState('');
  const [filterSent,        setFilterSent]        = useState('');
  const [search,            setSearch]            = useState('');
  const [selected,          setSelected]          = useState<Set<string>>(new Set());
  const [bulkLoading,       setBulkLoading]       = useState(false);

  const { data: certs = [], isLoading, refetch } = useQuery({
    queryKey: ['certificates', activeEventId, filterProductType, filterSent],
    queryFn: () => certificatesApi.getAll({
      eventId:       activeEventId || undefined,
      productTypeId: filterProductType || undefined,
      sent:          (filterSent as 'true' | 'false') || undefined,
    }),
    enabled: true,
  });

  const { data: productTypes = [] } = useQuery({
    queryKey: ['product-types'],
    queryFn: () => productTypesApi.getAll(true),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => certificatesApi.remove(id),
    onSuccess: () => { toast.success('Certificado eliminado'); qc.invalidateQueries({ queryKey: ['certificates'] }); },
    onError: () => toast.error('Error al eliminar'),
  });

  const handleDownload = async (cert: Certificate) => {
    try {
      const { url, fileName } = await certificatesApi.getDownloadUrl(cert.id);
      const a = document.createElement('a');
      a.href = url; a.download = fileName; a.target = '_blank';
      a.click();
    } catch { toast.error('Error al descargar'); }
  };

  const handleResend = async (cert: Certificate) => {
    try {
      const r = await certificatesApi.send([cert.id]);
      if (r.sent > 0) {
        toast.success(`Certificado reenviado a ${cert.author?.email}`);
        refetch();
      } else {
        toast.error('No se pudo reenviar el certificado');
      }
    } catch { toast.error('Error al reenviar'); }
  };

  const handleBulkSend = async () => {
    if (!activeEventId) { toast.error('Seleccione un evento primero'); return; }
    setBulkLoading(true);
    try {
      const r = await certificatesApi.bulkGenerateAndSend(activeEventId, filterProductType || undefined);
      toast.success(`Procesadas ${r.processed} postulaciones · ${r.sent} certificados enviados`);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error en envío masivo');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleSendSelected = async () => {
    if (selected.size === 0) return;
    try {
      const r = await certificatesApi.send([...selected]);
      toast.success(`${r.sent} enviados · ${r.failed} fallidos`);
      setSelected(new Set());
      refetch();
    } catch { toast.error('Error al enviar'); }
  };

  const filtered = certs.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.certificateNumber?.toLowerCase().includes(q) ||
      c.author?.fullName?.toLowerCase().includes(q) ||
      c.submission?.titleEs?.toLowerCase().includes(q) ||
      c.submission?.referenceCode?.toLowerCase().includes(q)
    );
  });

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(c => c.id)));
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <Award size={20} className="text-primary-700" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl text-gray-900">Certificados</h1>
            <p className="text-sm text-gray-500">{certs.length} registros</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {selected.size > 0 && (
            <button
              onClick={handleSendSelected}
              className="btn-primary btn-sm flex items-center gap-2"
            >
              <Send size={14} /> Enviar seleccionados ({selected.size})
            </button>
          )}
          <button
            onClick={handleBulkSend}
            disabled={bulkLoading}
            className="btn-outline btn-sm flex items-center gap-2"
          >
            {bulkLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Envío masivo ejecutados
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por N°, autor, título..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input pl-9 text-sm"
            />
          </div>
          <select
            value={filterProductType}
            onChange={e => setFilterProductType(e.target.value)}
            className="form-input text-sm"
          >
            <option value="">Todos los tipos</option>
            {productTypes.map(pt => (
              <option key={pt.id} value={pt.id}>{pt.name}</option>
            ))}
          </select>
          <select
            value={filterSent}
            onChange={e => setFilterSent(e.target.value)}
            className="form-input text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="true">Enviados</option>
            <option value="false">Pendientes de envío</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Award size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No hay certificados con estos filtros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleAll}
                      className="w-4 h-4 accent-primary-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">N° Certificado</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Autor</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Título / Referencia</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Emitido</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 text-xs uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(cert.id)}
                        onChange={() => toggleSelect(cert.id)}
                        className="w-4 h-4 accent-primary-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                        {cert.certificateNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-800">{cert.author?.fullName}</p>
                        <p className="text-xs text-gray-400">{cert.author?.email}</p>
                        {cert.author?.isCorresponding && (
                          <span className="text-xs text-primary-600 font-medium">Autor Principal</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-gray-800 line-clamp-2 text-xs">{cert.submission?.titleEs}</p>
                      <p className="text-gray-400 text-xs font-mono mt-0.5">{cert.submission?.referenceCode}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {cert.productTypeName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(cert.issuedAt)}
                    </td>
                    <td className="px-4 py-3">
                      {cert.emailSentAt ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle size={11} /> Enviado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          <Clock size={11} /> Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleDownload(cert)}
                          title="Descargar PDF"
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-primary-600 transition-colors"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          onClick={() => handleResend(cert)}
                          title="Reenviar por correo"
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <Send size={15} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('¿Eliminar este certificado?')) deleteMutation.mutate(cert.id);
                          }}
                          title="Eliminar"
                          className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resumen */}
      {certs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: certs.length, color: 'text-gray-800' },
            { label: 'Enviados', value: certs.filter(c => c.emailSentAt).length, color: 'text-emerald-700' },
            { label: 'Pendientes', value: certs.filter(c => !c.emailSentAt).length, color: 'text-amber-700' },
            { label: 'Autores distintos', value: new Set(certs.map(c => c.authorId)).size, color: 'text-primary-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
