import { useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Upload, Download, Award, CheckCircle, Clock, AlertCircle, XCircle,
  Pencil, X, FileText, Lock, UserPlus, Trash2, Loader2,
} from 'lucide-react';
import { portalApi } from '../../api/portal.api';
import { countriesApi, universitiesApi, facultiesApi, researchGroupsApi } from '../../api/index';
import { STATUS_CONFIG, formatDate, getFileUrl } from '../../utils';
import CountrySelect from '../ui/CountrySelect';
import UniversitySelect, { OTHER_UNIVERSITY_VALUE } from '../ui/UniversitySelect';

const PARTICIPANT_TYPES = [
  { value: 'profesor', label: 'Profesor/a' },
  { value: 'estudiante', label: 'Estudiante' },
  { value: 'profesional_graduado', label: 'Profesional Graduado/a' },
];

const STATUS_ICONS: Record<string, React.ReactNode> = {
  received: <Clock size={14} className="text-blue-500" />,
  under_review: <Clock size={14} className="text-yellow-500" />,
  revision_requested: <AlertCircle size={14} className="text-orange-500" />,
  approved: <CheckCircle size={14} className="text-green-600" />,
  rejected: <XCircle size={14} className="text-red-500" />,
  withdrawn: <XCircle size={14} className="text-gray-400" />,
  cancelled: <XCircle size={14} className="text-gray-400" />,
  scheduled: <CheckCircle size={14} className="text-green-600" />,
  executed: <CheckCircle size={14} className="text-green-700" />,
  certificate_sent: <Award size={14} className="text-primary-600" />,
};

interface Props {
  submission: any;
  onUpdated: () => void;
}

interface AddAuthorFormState {
  fullName: string; email: string; academicTitle: string; participantType: string;
  universityId: string; universityName: string; facultyId: string; researchGroupId: string;
  orcid: string; phone: string; countryId: string; city: string; isPresenter: boolean;
}

function AddAuthorModal({
  onSubmit, onClose, isPending,
}: {
  onSubmit: (data: Record<string, any>) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<AddAuthorFormState>({
    fullName: '', email: '', academicTitle: '', participantType: '',
    universityId: '', universityName: '', facultyId: '', researchGroupId: '',
    orcid: '', phone: '', countryId: '', city: '', isPresenter: true,
  });

  const { data: countries } = useQuery({
    queryKey: ['countries'],
    queryFn: () => countriesApi.getAll(true),
  });

  const { data: universities } = useQuery({
    queryKey: ['universities'],
    queryFn: () => universitiesApi.getAll({ active: true }),
  });

  const { data: faculties } = useQuery({
    queryKey: ['faculties'],
    queryFn: () => facultiesApi.getAll({ active: true }),
  });

  const { data: researchGroups } = useQuery({
    queryKey: ['research-groups'],
    queryFn: () => researchGroupsApi.getAll({ active: true }),
  });

  const selectedUniversity = universities?.find((u) => u.id === form.universityId);
  const isHostStudent = form.participantType === 'estudiante' && selectedUniversity?.isHostInstitution;

  const set = (field: keyof AddAuthorFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.countryId || !form.universityId) return toast.error('País y universidad son requeridos');
    if (form.universityId === OTHER_UNIVERSITY_VALUE && form.universityName.trim().length < 2) {
      return toast.error('Escriba el nombre de la universidad');
    }
    if (isHostStudent && !form.facultyId) {
      return toast.error('La facultad es requerida para estudiantes de la institución sede');
    }
    const dto: Record<string, any> = { ...form };
    if (dto.universityId === OTHER_UNIVERSITY_VALUE) delete dto.universityId;
    Object.keys(dto).forEach((k) => { if (dto[k] === '') delete dto[k]; });
    onSubmit(dto);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-heading font-bold text-lg text-gray-900">Agregar coautor</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="form-label">Nombre completo *</label>
              <input className="form-input" required value={form.fullName} onChange={set('fullName')} />
            </div>
            <div className="col-span-2">
              <label className="form-label">Correo electrónico *</label>
              <input type="email" className="form-input" required value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="form-label">Título académico</label>
              <input className="form-input" value={form.academicTitle} onChange={set('academicTitle')} placeholder="Dr., Mg., Esp…" />
            </div>
            <div>
              <label className="form-label">Rol de Participación</label>
              <select className="form-input" value={form.participantType} onChange={set('participantType')}>
                <option value="">Seleccione...</option>
                {PARTICIPANT_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">País *</label>
              <CountrySelect
                countries={countries}
                value={form.countryId}
                onChange={(id) => setForm((prev) => ({ ...prev, countryId: id, universityId: '', universityName: '', facultyId: '', researchGroupId: '' }))}
              />
            </div>
            <div className="col-span-2">
              <label className="form-label">Institución / Universidad *</label>
              <UniversitySelect
                universities={universities?.filter((u) => u.countryId === form.countryId)}
                disabled={!form.countryId}
                value={form.universityId}
                onChange={(id) => setForm((prev) => ({ ...prev, universityId: id, facultyId: '', researchGroupId: '' }))}
              />
              {form.universityId === OTHER_UNIVERSITY_VALUE && (
                <input
                  className="form-input mt-2"
                  value={form.universityName}
                  onChange={set('universityName')}
                  placeholder="Escriba el nombre de la universidad o institución"
                />
              )}
            </div>
            {isHostStudent && (
              <>
                <div>
                  <label className="form-label">Facultad *</label>
                  <select className="form-input" value={form.facultyId} onChange={set('facultyId')}>
                    <option value="">Seleccione...</option>
                    {faculties?.filter((f) => f.universityId === form.universityId).map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Semillero de Investigación</label>
                  <select className="form-input" value={form.researchGroupId} onChange={set('researchGroupId')}>
                    <option value="">No pertenece a un semillero</option>
                    {researchGroups?.filter((g) => g.universityId === form.universityId).map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="form-label">ORCID</label>
              <input className="form-input" value={form.orcid} onChange={set('orcid')} placeholder="https://orcid.org/0000-0000-0000-0000" />
            </div>
            <div>
              <label className="form-label">Teléfono</label>
              <input className="form-input" value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className="form-label">Ciudad</label>
              <input className="form-input" value={form.city} onChange={set('city')} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded accent-[#007F3A]"
              checked={form.isPresenter}
              onChange={(e) => setForm((prev) => ({ ...prev, isPresenter: e.target.checked }))}
            />
            Ponente
          </label>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-outline btn-sm">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="btn-primary btn-sm flex items-center gap-1.5">
              {isPending && <Loader2 size={13} className="animate-spin" />}
              Agregar autor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SubmissionManagePanel({ submission, onUpdated }: Props) {
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [editing, setEditing] = useState(false);
  const [showAddAuthor, setShowAddAuthor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: certs = [] } = useQuery({
    queryKey: ['portal-certs', submission.id],
    queryFn: () => portalApi.getMyCertificates(submission.id),
  });

  const [form, setForm] = useState({
    titleEs: submission.titleEs ?? '',
    titleEn: submission.titleEn ?? '',
    abstractEs: submission.abstractEs ?? '',
    abstractEn: submission.abstractEn ?? '',
    keywordsEs: submission.keywordsEs ?? '',
    keywordsEn: submission.keywordsEn ?? '',
  });

  const revisionMutation = useMutation({
    mutationFn: () => portalApi.uploadRevision(submission.id, revisionFile!, revisionNotes || undefined),
    onSuccess: () => {
      toast.success('Documento subido correctamente');
      setRevisionFile(null);
      setRevisionNotes('');
      onUpdated();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al subir el archivo'),
  });

  const updateMutation = useMutation({
    mutationFn: () => portalApi.updateSubmission(submission.id, form),
    onSuccess: () => {
      toast.success('Postulación actualizada');
      setEditing(false);
      onUpdated();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al guardar los cambios'),
  });

  const addAuthorMutation = useMutation({
    mutationFn: (data: Record<string, any>) => portalApi.addAuthor(submission.id, data),
    onSuccess: () => {
      toast.success('Autor agregado');
      setShowAddAuthor(false);
      onUpdated();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al agregar el autor'),
  });

  const removeAuthorMutation = useMutation({
    mutationFn: (authorId: string) => portalApi.removeAuthor(submission.id, authorId),
    onSuccess: () => {
      toast.success('Autor eliminado');
      onUpdated();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al eliminar el autor'),
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

  const cfg = STATUS_CONFIG[submission.status as keyof typeof STATUS_CONFIG];
  const canEdit = !!submission.canEdit;
  const canEditAuthors = !!submission.canEditAuthors;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="font-mono text-xs text-gray-400 mb-1">{submission.referenceCode}</p>
            <h1 className="text-lg font-bold text-gray-800">{submission.titleEs}</h1>
          </div>
          {cfg && (
            <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${cfg.bgColor} ${cfg.textColor}`}>
              {cfg.label}
            </span>
          )}
        </div>
        {submission.event && (
          <p className="text-xs text-gray-400">{submission.event.name}</p>
        )}
        {!canEdit && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
            <Lock size={12} />
            Esta postulación ya no admite cambios en el estatus actual.
          </div>
        )}
      </div>

      {/* Editar datos */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Datos de la postulación</h2>
          {canEdit && (
            <button
              onClick={() => setEditing((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#007F3A] hover:underline"
            >
              {editing ? <><X size={13} /> Cancelar</> : <><Pencil size={13} /> Editar</>}
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="form-label">Título en Español</label>
              <input className="form-input" value={form.titleEs} onChange={(e) => setForm({ ...form, titleEs: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Título en Inglés</label>
              <input className="form-input" value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Resumen en Español</label>
              <textarea rows={5} className="form-input resize-none" value={form.abstractEs} onChange={(e) => setForm({ ...form, abstractEs: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Abstract (English)</label>
              <textarea rows={4} className="form-input resize-none" value={form.abstractEn} onChange={(e) => setForm({ ...form, abstractEn: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Palabras clave (ES)</label>
                <input className="form-input" value={form.keywordsEs} onChange={(e) => setForm({ ...form, keywordsEs: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Keywords (EN)</label>
                <input className="form-input" value={form.keywordsEn} onChange={(e) => setForm({ ...form, keywordsEn: e.target.value })} />
              </div>
            </div>
            <button
              disabled={updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
              className="w-full py-2.5 bg-[#007F3A] hover:bg-[#005c2a] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-0.5">Título</p>
              <p className="text-gray-700">{submission.titleEs}</p>
            </div>
            {submission.abstractEs && (
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-0.5">Resumen</p>
                <p className="text-gray-600 line-clamp-3">{submission.abstractEs}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subir documento actualizado */}
      {canEdit && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Actualizar documento
          </h2>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".doc,.docx,.pdf,.ppt,.pptx"
            onChange={(e) => setRevisionFile(e.target.files?.[0] ?? null)}
          />

          {revisionFile ? (
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 mb-3">
              <Upload size={14} className="text-[#007F3A] shrink-0" />
              <span className="truncate">{revisionFile.name}</span>
              <button onClick={() => setRevisionFile(null)} className="ml-auto text-gray-400 hover:text-red-500 shrink-0">×</button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-[#007F3A]/40 hover:text-[#007F3A] transition-colors mb-3"
            >
              <Upload size={16} />
              Seleccionar archivo actualizado
            </button>
          )}

          <textarea
            rows={2}
            placeholder="Notas sobre los cambios realizados (opcional)"
            value={revisionNotes}
            onChange={(e) => setRevisionNotes(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg p-3 mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#007F3A]/30 bg-white"
          />

          <button
            disabled={!revisionFile || revisionMutation.isPending}
            onClick={() => revisionMutation.mutate()}
            className="w-full py-2.5 bg-[#007F3A] hover:bg-[#005c2a] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
          >
            {revisionMutation.isPending ? 'Enviando...' : 'Subir documento'}
          </button>

          {(submission.files?.length ?? 0) > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
              <p className="text-xs font-semibold text-gray-400 mb-2">Historial de archivos</p>
              {submission.files.map((f: any) => (
                <div key={f.id} className="flex items-center gap-2 text-xs text-gray-600">
                  <FileText size={12} className="text-gray-400 shrink-0" />
                  <span className="truncate">{f.fileName}</span>
                  <span className="text-gray-300 shrink-0">v{f.version}</span>
                  <span className="ml-auto text-gray-400 shrink-0">{formatDate(f.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline de estados */}
      {submission.statusHistory?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Historial de estados
          </h2>
          <ol className="relative border-l-2 border-gray-100 space-y-5 ml-2">
            {submission.statusHistory.map((h: any) => {
              const hCfg = STATUS_CONFIG[h.newStatus as keyof typeof STATUS_CONFIG];
              return (
                <li key={h.id} className="ml-5">
                  <div className="absolute -left-[9px] w-4 h-4 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                    {STATUS_ICONS[h.newStatus] ?? <div className="w-2 h-2 rounded-full bg-gray-300" />}
                  </div>
                  <div className="flex items-center gap-2 mb-0.5">
                    {hCfg && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hCfg.bgColor} ${hCfg.textColor}`}>
                        {hCfg.label}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{formatDate(h.createdAt, 'dd MMM yyyy HH:mm')}</span>
                  </div>
                  {h.notes && (
                    <div className="mt-1 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                      {h.notes}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Certificados de esta postulación */}
      {certs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Certificados
          </h2>
          <div className="space-y-3">
            {certs.map((cert: any) => (
              <div key={cert.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div>
                  <p className="text-xs font-semibold text-gray-700">
                    {cert.productTypeName ?? 'Certificado de participación'}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono">{cert.certificateNumber}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Emitido: {formatDate(cert.issuedAt)}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  {cert.hasFile && (
                    <button
                      onClick={() => downloadCert(cert.id, 'diploma')}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-primary-600 text-white text-[10px] font-semibold rounded-lg hover:bg-primary-500 transition-colors"
                    >
                      <Download size={10} /> Diploma
                    </button>
                  )}
                  {cert.hasFileCarta && (
                    <button
                      onClick={() => downloadCert(cert.id, 'carta')}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-600 text-white text-[10px] font-semibold rounded-lg hover:bg-gray-500 transition-colors"
                    >
                      <Download size={10} /> Carta
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Autores */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Autores</h2>
          {canEditAuthors && (
            <button
              onClick={() => setShowAddAuthor(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#007F3A] hover:underline"
            >
              <UserPlus size={13} /> Agregar autor
            </button>
          )}
        </div>

        {!canEditAuthors && (
          <div className="mb-3 flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
            <Lock size={12} />
            Ya no puedes agregar o quitar autores en el estatus actual.
          </div>
        )}

        <div className="space-y-2">
          {(submission.authors ?? []).map((a: any) => (
            <div key={a.id} className="flex items-center gap-3 text-xs">
              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-[10px] shrink-0">
                {a.authorOrder + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-700 flex items-center gap-1.5">
                  {a.fullName}
                  {a.university?.logoUrl && (
                    <img
                      src={getFileUrl(a.university.logoUrl)}
                      alt={a.university.name}
                      title={a.university.name}
                      className="w-4 h-4 object-contain rounded bg-white border border-gray-200"
                    />
                  )}
                </p>
                <p className="text-gray-400 truncate">
                  {[a.academicTitle, a.university?.name || a.affiliation].filter(Boolean).join(' · ')}
                </p>
              </div>
              {a.isCorresponding && (
                <span className="ml-auto text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full shrink-0">
                  Correspondiente
                </span>
              )}
              {canEditAuthors && !a.isCorresponding && (
                <button
                  onClick={() => {
                    if (confirm(`¿Quitar a ${a.fullName} de esta postulación?`)) {
                      removeAuthorMutation.mutate(a.id);
                    }
                  }}
                  disabled={removeAuthorMutation.isPending}
                  className="ml-auto shrink-0 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40"
                  title="Quitar autor"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {showAddAuthor && (
        <AddAuthorModal
          onSubmit={(data) => addAuthorMutation.mutate(data)}
          onClose={() => setShowAddAuthor(false)}
          isPending={addAuthorMutation.isPending}
        />
      )}
    </div>
  );
}
