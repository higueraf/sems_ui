import { useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2, Upload, CheckCircle, User, FileText, Camera, X } from 'lucide-react';
import { eventsApi } from '../../api/events.api';
import { submissionsApi } from '../../api/submissions.api';
import { countriesApi, productTypesApi, thematicAxesApi } from '../../api/index';
import { useScrollToTop } from '../../hooks/useScrollToTop';

const authorSchema = z.object({
  fullName: z.string().min(2, 'Nombre requerido'),
  academicTitle: z.string().min(1, 'Título académico requerido'),
  affiliation: z.string().optional(),
  emailType: z.string().min(1, 'Tipo de correo requerido'),
  email: z.string().email('Email inválido'),
  orcid: z.string().url('ORCID debe ser una URL válida').regex(/^https:\/\/orcid\.org\/\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/, 'ORCID debe tener el formato https://orcid.org/XXXX-XXXX-XXXX-XXXX'),
  phone: z.string().optional(),
  countryId: z.string().optional(),
  city: z.string().optional(),
  isCorresponding: z.boolean().default(false),
  authorOrder: z.number().default(0),
  identityDocType: z.string().min(1, 'Tipo de documento requerido'),
  identityDocNumber: z.string().min(1, 'Número de documento requerido'),
});

const formSchema = z.object({
  eventId: z.string().uuid(),
  thematicAxisId: z.string().uuid('Seleccione un eje temático'),
  productTypeIds: z
    .array(z.string().uuid())
    .min(1, 'Seleccione al menos un tipo de producto científico'),
  titleEs: z.string().min(5, 'Título requerido (mínimo 5 caracteres)'),
  titleEn: z.string().optional(),
  abstractEs: z.string().min(50, 'Resumen mínimo 50 caracteres').max(5000, 'Máximo 5000 caracteres'),
  abstractEn: z.string().optional(),
  keywordsEs: z.string().optional(),
  keywordsEn: z.string().optional(),
  introduction: z.string().optional(),
  methodology: z.string().optional(),
  results: z.string().optional(),
  discussion: z.string().optional(),
  conclusions: z.string().optional(),
  bibliography: z.string().optional(),
  countryId: z.string().optional(),
  usesAi: z.boolean().default(false),
  aiUsageDescription: z.string().optional(),
  pageCount: z.coerce.number().optional(),
  authors: z.array(authorSchema).min(1).max(4),
});

type FormValues = z.infer<typeof formSchema>;
type Step = 'info' | 'authors' | 'content' | 'confirm';

const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: 'info',    label: 'Información', icon: <FileText size={16} /> },
  { key: 'authors', label: 'Autores',     icon: <User size={16} /> },
  { key: 'content', label: 'Contenido',   icon: <FileText size={16} /> },
  { key: 'confirm', label: 'Confirmar',   icon: <CheckCircle size={16} /> },
];

// ── Componente de foto de autor ──────────────────────────────────────────────

interface AuthorPhotoPickerProps {
  index: number;
  authorName: string;
  photo: File | null;
  onChange: (file: File | null) => void;
}

function AuthorPhotoPicker({ index, authorName, photo, onChange }: AuthorPhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = photo ? URL.createObjectURL(photo) : null;

  const handleFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La foto no debe superar 5 MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Use JPG, PNG o WebP');
      return;
    }
    onChange(file);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Avatar circular con preview o placeholder */}
      <div
        className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-primary-400 transition-colors group"
        onClick={() => inputRef.current?.click()}
        title="Clic para subir foto"
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt={`Foto ${authorName || `Autor ${index + 1}`}`}
              className="w-full h-full object-cover"
            />
            {/* Overlay al hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera size={20} className="text-white" />
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-1">
            <Camera size={22} />
            <span className="text-[10px] text-center leading-tight px-1">Foto del ponente</span>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs text-primary-600 hover:text-primary-800 font-medium underline underline-offset-2"
        >
          {preview ? 'Cambiar' : 'Subir foto'}
        </button>
        {preview && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="text-xs text-red-400 hover:text-red-600 flex items-center gap-0.5"
          >
            <X size={12} /> Quitar
          </button>
        )}
      </div>

      <p className="text-[10px] text-gray-400 text-center">JPG/PNG/WebP · máx 5 MB<br />Obligatorio — para la agenda del evento</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = ''; // reset para permitir re-selección del mismo archivo
        }}
      />
    </div>
  );
}

// ── Componente de documento de identidad de autor ────────────────────────────

interface AuthorIdDocPickerProps {
  index: number;
  authorName: string;
  idDoc: File | null;
  onChange: (file: File | null) => void;
}

function AuthorIdDocPicker({ index, authorName, idDoc, onChange }: AuthorIdDocPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El documento no debe superar 5 MB');
      return;
    }
    if (!['application/pdf'].includes(file.type)) {
      toast.error('El documento debe estar en formato PDF');
      return;
    }
    onChange(file);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-primary-400 transition-colors group"
        onClick={() => inputRef.current?.click()}
        title="Clic para subir documento de identidad"
      >
        {idDoc ? (
          <>
            <div className="w-full h-full flex flex-col items-center justify-center text-red-600 gap-1">
              <FileText size={22} />
              <span className="text-[10px] text-center leading-tight px-1">PDF</span>
            </div>
            {/* Overlay al hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload size={20} className="text-white" />
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-1">
            <Upload size={22} />
            <span className="text-[10px] text-center leading-tight px-1">Documento ID</span>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs text-primary-600 hover:text-primary-800 font-medium underline underline-offset-2"
        >
          {idDoc ? 'Cambiar' : 'Subir'}
        </button>
        {idDoc && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="text-xs text-red-400 hover:text-red-600 flex items-center gap-0.5"
          >
            <X size={12} /> Quitar
          </button>
        )}
      </div>

      <p className="text-[10px] text-gray-400 text-center">PDF · máx 5 MB<br />Requerido</p>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = ''; // reset para permitir re-selección del mismo archivo
        }}
      />
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function Submit() {
  useScrollToTop(); // Scroll automático al principio de la página
  const [step, setStep]           = useState<Step>('info');
  const [file, setFile]           = useState<File | null>(null);
  const [authorPhotos, setAuthorPhotos] = useState<(File | null)[]>([null, null, null, null]);
  const [authorIdDocs, setAuthorIdDocs] = useState<(File | null)[]>([null, null, null, null]);
  const [submitted, setSubmitted] = useState<{ referenceCode: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: event } = useQuery({
    queryKey: ['event-active'],
    queryFn: eventsApi.getActive,
  });

  const { data: countries } = useQuery({
    queryKey: ['countries'],
    queryFn: () => countriesApi.getAll(true),
  });

  const { data: productTypes } = useQuery({
    queryKey: ['product-types'],
    queryFn: () => productTypesApi.getAll(true),
  });

  const { data: thematicAxes } = useQuery({
    queryKey: ['thematic-axes-public', event?.id],
    queryFn: () => thematicAxesApi.getPublic(event!.id),
    enabled: !!event?.id,
  });

  const {
    register, control, handleSubmit, watch,
    formState: { errors }, trigger, setValue, getValues,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventId: '00000000-0000-0000-0000-000000000000',
      productTypeIds: [],
      authors: [{ 
        fullName: '', 
        academicTitle: '', 
        emailType: '',
        email: '', 
        orcid: '', 
        identityDocType: '', 
        identityDocNumber: '',
        isCorresponding: true, 
        authorOrder: 0 
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'authors' });

  const toggleProductType = (id: string) => {
    const current = getValues('productTypeIds') ?? [];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    setValue('productTypeIds', next, { shouldValidate: true });
  };

  const handleNext = async () => {
    const fieldsToValidate: Record<Step, (keyof FormValues)[]> = {
      info:    ['thematicAxisId', 'productTypeIds', 'titleEs', 'abstractEs', 'countryId'],
      authors: ['authors'],
      content: [],
      confirm: [],
    };
    const valid = await trigger(fieldsToValidate[step] as any);
    if (valid) {
      const order: Step[] = ['info', 'authors', 'content', 'confirm'];
      const nextIndex = order.indexOf(step) + 1;
      if (nextIndex < order.length) setStep(order[nextIndex]);
    }
  };

  const onSubmit = async (data: FormValues) => {
    const eventId = event?.id;
    if (!eventId) { toast.error('No hay evento activo. Recargue la página.'); return; }

    setIsSubmitting(true);
    try {
      const formData = new FormData();

      const payload = {
        ...data,
        eventId,
        productTypeId: data.productTypeIds[0],
        authors: data.authors.map((a, i) => ({ ...a, authorOrder: i })),
      };

      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (key === 'authors' || key === 'productTypeIds') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });

      // Manuscrito
      if (file) formData.append('file', file);

      // Fotos de autores — fieldname = "authorPhoto_0", "authorPhoto_1", ...
      authorPhotos.forEach((photo, idx) => {
        if (photo) formData.append(`authorPhoto_${idx}`, photo, photo.name);
      });

      // Documentos de identidad — fieldname = "authorIdDoc_0", "authorIdDoc_1", ...
      authorIdDocs.forEach((doc, idx) => {
        if (doc) formData.append(`authorIdDoc_${idx}`, doc, doc.name);
      });

      const result = await submissionsApi.create(formData);
      setSubmitted({ referenceCode: result.referenceCode });
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (Array.isArray(msg)) toast.error(msg.join(' | '));
      else toast.error(msg || 'Error al enviar la postulación');
      console.error('[Submit] error:', err?.response?.data ?? err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="font-heading font-bold text-2xl text-gray-900 mb-2">¡Postulación Recibida!</h2>
          <p className="text-gray-500 mb-6">
            Su trabajo ha sido enviado exitosamente. Hemos enviado un correo de confirmación al autor de correspondencia.
          </p>
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">Código de referencia</p>
            <p className="font-heading font-bold text-2xl text-primary-600">{submitted.referenceCode}</p>
            <p className="text-xs text-gray-400 mt-1">Guarde este código para consultar el estado de su postulación</p>
          </div>
          <a href="/verificar" className="btn-primary inline-block">Verificar mi estado</a>
        </div>
      </div>
    );
  }

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const selectedProductTypeIds = watch('productTypeIds') ?? [];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="font-heading font-bold text-3xl text-gray-900 mb-2">
            Postulación de Trabajo Científico
          </h1>
          <p className="text-gray-500">
            Complete el formulario para enviar su postulación al {event?.name}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8 overflow-x-auto">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                i <= stepIndex ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {s.icon}{s.label}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${i < stepIndex ? 'bg-primary-500' : 'bg-gray-300'}`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="card">

            {/* ── STEP 1: Información ────────────────────────────────────── */}
            {step === 'info' && (
              <div className="space-y-6">
                <h2 className="font-heading font-bold text-xl text-gray-800 border-b pb-3">
                  Información del Trabajo
                </h2>

                {event?.id && <input type="hidden" {...register('eventId')} value={event.id} />}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Eje Temático *</label>
                    <select className="form-input" {...register('thematicAxisId')}>
                      <option value="">Seleccione un eje...</option>
                      {thematicAxes?.map((axis) => (
                        <option key={axis.id} value={axis.id}>{axis.name}</option>
                      ))}
                    </select>
                    {errors.thematicAxisId && <p className="form-error">{errors.thematicAxisId.message}</p>}
                  </div>

                  <div>
                    <label className="form-label">Tipo de Producto Científico *</label>
                    <div className="border border-gray-300 rounded-lg divide-y divide-gray-100 max-h-56 overflow-y-auto">
                      {productTypes?.map((pt) => {
                        const checked = selectedProductTypeIds.includes(pt.id);
                        return (
                          <label key={pt.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${checked ? 'bg-primary-50' : ''}`}>
                            <input type="checkbox" checked={checked} onChange={() => toggleProductType(pt.id)} className="w-4 h-4 accent-primary-500 shrink-0" />
                            <span className="text-sm text-gray-700 leading-tight">{pt.name}</span>
                          </label>
                        );
                      })}
                    </div>
                    {selectedProductTypeIds.length > 0 && (
                      <p className="text-xs text-primary-600 mt-1 font-medium">
                        {selectedProductTypeIds.length} tipo{selectedProductTypeIds.length > 1 ? 's' : ''} seleccionado{selectedProductTypeIds.length > 1 ? 's' : ''}
                      </p>
                    )}
                    {errors.productTypeIds && <p className="form-error">{errors.productTypeIds.message as string}</p>}
                  </div>
                </div>

                <div>
                  <label className="form-label">Título en Español * (tamaño 14)</label>
                  <input type="text" className="form-input" {...register('titleEs')} placeholder="Título completo del trabajo en español" />
                  {errors.titleEs && <p className="form-error">{errors.titleEs.message}</p>}
                </div>

                <div>
                  <label className="form-label">Título en Inglés</label>
                  <input type="text" className="form-input" {...register('titleEn')} placeholder="Title in English" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">País de la institución principal</label>
                    <select className="form-input" {...register('countryId')}>
                      <option value="">Seleccione país...</option>
                      {countries?.map((c) => (
                        <option key={c.id} value={c.id}>{c.flagEmoji} {c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Número de páginas</label>
                    <input type="number" className="form-input" {...register('pageCount')} min={1} max={30} />
                  </div>
                </div>

                <div>
                  <label className="form-label">Resumen en Español * (máximo 250 palabras)</label>
                  <textarea rows={6} className="form-input resize-none" {...register('abstractEs')} placeholder="Escriba el resumen del trabajo..." />
                  {errors.abstractEs && <p className="form-error">{errors.abstractEs.message}</p>}
                </div>

                <div>
                  <label className="form-label">Palabras Clave en Español (máximo 6, orden alfabético)</label>
                  <input type="text" className="form-input" {...register('keywordsEs')} placeholder="palabra1, palabra2, palabra3" />
                </div>

                <div>
                  <label className="form-label">Abstract (English)</label>
                  <textarea rows={4} className="form-input resize-none" {...register('abstractEn')} placeholder="Write the abstract in English..." />
                </div>

                <div>
                  <label className="form-label">Keywords (English)</label>
                  <input type="text" className="form-input" {...register('keywordsEn')} placeholder="keyword1, keyword2, keyword3" />
                </div>

                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <input type="checkbox" id="usesAi" {...register('usesAi')} className="w-4 h-4" />
                  <label htmlFor="usesAi" className="text-sm text-amber-800 font-medium">
                    El trabajo utiliza Inteligencia Artificial (debe ser citada correctamente)
                  </label>
                </div>

                {watch('usesAi') && (
                  <div>
                    <label className="form-label">Descripción del uso de IA</label>
                    <textarea rows={3} className="form-input resize-none" {...register('aiUsageDescription')} placeholder="Describa cómo se utilizó la IA en este trabajo..." />
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 2: Autores ────────────────────────────────────────── */}
            {step === 'authors' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <h2 className="font-heading font-bold text-xl text-gray-800">
                    Datos de los Autores (máximo 4)
                  </h2>
                  {fields.length < 4 && (
                    <button
                      type="button"
                      onClick={() => append({ 
        fullName: '', 
        academicTitle: '', 
        emailType: '',
        email: '', 
        orcid: '', 
        identityDocType: '', 
        identityDocNumber: '',
        isCorresponding: false, 
        authorOrder: fields.length 
      })}
                      className="btn-outline btn-sm flex items-center gap-1"
                    >
                      <Plus size={16} /> Agregar Autor
                    </button>
                  )}
                </div>

                {/* Aviso contextual sobre las fotos y documentos */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-start gap-3 text-sm text-blue-800">
                  <Camera size={18} className="shrink-0 mt-0.5 text-blue-500" />
                  <div>
                    <p className="font-semibold mb-1">Documentos requeridos:</p>
                    <ul className="list-disc ml-4 space-y-1">
                      <li><strong>Foto del ponente (obligatoria):</strong> Se utilizará en la agenda pública del evento si el trabajo es aprobado</li>
                      <li><strong>Documento de identidad (obligatorio):</strong> PDF de cédula/pasaporte para validación</li>
                    </ul>
                  </div>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="border border-gray-200 rounded-xl p-6 relative">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        Autor {index + 1}
                        {watch(`authors.${index}.isCorresponding`) && (
                          <span className="badge bg-primary-100 text-primary-700 ml-2">Correspondencia</span>
                        )}
                      </h3>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                          <input
                            type="radio"
                            name="correspondingAuthor"
                            checked={watch(`authors.${index}.isCorresponding`)}
                            onChange={() => fields.forEach((_, i) => setValue(`authors.${i}.isCorresponding`, i === index))}
                            className="w-4 h-4 accent-primary-500"
                          />
                          Autor de correspondencia
                        </label>
                        {fields.length > 1 && (
                          <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600 p-1">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Layout: foto y documento de identidad a la izquierda, campos a la derecha */}
                    <div className="flex flex-col sm:flex-row gap-6">

                      {/* Columna izquierda: foto y documento de identidad centrados */}
                      <div className="flex flex-col gap-4 items-center flex-shrink-0">
                        {/* Foto del autor */}
                        <div className="flex justify-center">
                          <AuthorPhotoPicker
                            index={index}
                            authorName={watch(`authors.${index}.fullName`)}
                            photo={authorPhotos[index]}
                            onChange={(f) => {
                              setAuthorPhotos(prev => {
                                const next = [...prev];
                                next[index] = f;
                                return next;
                              });
                            }}
                          />
                        </div>

                        {/* Documento de identidad */}
                        <div className="flex justify-center">
                          <AuthorIdDocPicker
                            index={index}
                            authorName={watch(`authors.${index}.fullName`)}
                            idDoc={authorIdDocs[index]}
                            onChange={(f) => {
                              setAuthorIdDocs(prev => {
                                const next = [...prev];
                                next[index] = f;
                                return next;
                              });
                            }}
                          />
                        </div>
                      </div>

                      {/* Campos del autor */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">Nombres Completos *</label>
                          <input className="form-input" {...register(`authors.${index}.fullName`)} placeholder="Nombre Apellido" />
                          {errors.authors?.[index]?.fullName && <p className="form-error">{errors.authors[index]?.fullName?.message}</p>}
                        </div>
                        <div>
                          <label className="form-label">Título Académico *</label>
                          <select className="form-input" {...register(`authors.${index}.academicTitle`)}>
                            <option value="">Seleccione...</option>
                            <option value="Estudiante">Estudiante</option>
                            <option value="Licenciado/a">Licenciado/a</option>
                            <option value="Ingeniero/a">Ingeniero/a</option>
                            <option value="Especialista">Especialista</option>
                            <option value="Magíster / Mg.">Magíster / Mg.</option>
                            <option value="Doctor/a / PhD.">Doctor/a / PhD.</option>
                            <option value="Postdoctorado">Postdoctorado</option>
                            <option value="Profesor/a">Profesor/a</option>
                            <option value="Investigador/a">Investigador/a</option>
                            <option value="Otro">Otro</option>
                          </select>
                          {errors.authors?.[index]?.academicTitle && <p className="form-error">{errors.authors[index]?.academicTitle?.message}</p>}
                        </div>
                        <div>
                          <label className="form-label">Tipo de Correo *</label>
                          <select className="form-input" {...register(`authors.${index}.emailType`)}>
                            <option value="">Seleccione...</option>
                            <option value="institutional">Institucional</option>
                            <option value="personal">Personal</option>
                          </select>
                          {errors.authors?.[index]?.emailType && <p className="form-error">{errors.authors[index]?.emailType?.message}</p>}
                        </div>
                        <div>
                          <label className="form-label">Email *</label>
                          <input type="email" className="form-input" {...register(`authors.${index}.email`)} placeholder="correo@ejemplo.com" />
                          {errors.authors?.[index]?.email && <p className="form-error">{errors.authors[index]?.email?.message}</p>}
                        </div>
                        <div>
                          <label className="form-label">ORCID *</label>
                          <input className="form-input" {...register(`authors.${index}.orcid`)} placeholder="https://orcid.org/0000-0000-0000-0000" />
                          {errors.authors?.[index]?.orcid && <p className="form-error">{errors.authors[index]?.orcid?.message}</p>}
                        </div>
                        <div>
                          <label className="form-label">Teléfono</label>
                          <input className="form-input" {...register(`authors.${index}.phone`)} placeholder="+593 999 999 999" />
                        </div>
                        <div>
                          <label className="form-label">País</label>
                          <select className="form-input" {...register(`authors.${index}.countryId`)}>
                            <option value="">Seleccione...</option>
                            {countries?.map((c) => (
                              <option key={c.id} value={c.id}>{c.flagEmoji} {c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="form-label">Ciudad</label>
                          <input className="form-input" {...register(`authors.${index}.city`)} placeholder="Ciudad" />
                        </div>
                        <div>
                          <label className="form-label">Tipo de Documento *</label>
                          <select className="form-input" {...register(`authors.${index}.identityDocType`)}>
                            <option value="">Seleccione...</option>
                            <option value="Cédula Nacional">Cédula Nacional</option>
                            <option value="Cédula Internacional">Cédula Internacional</option>
                            <option value="Pasaporte">Pasaporte</option>
                          </select>
                          {errors.authors?.[index]?.identityDocType && <p className="form-error">{errors.authors[index]?.identityDocType?.message}</p>}
                        </div>
                        <div>
                          <label className="form-label">Número de Documento *</label>
                          <input className="form-input" {...register(`authors.${index}.identityDocNumber`)} placeholder="Número de documento" />
                          {errors.authors?.[index]?.identityDocNumber && <p className="form-error">{errors.authors[index]?.identityDocNumber?.message}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── STEP 3: Contenido ──────────────────────────────────────── */}
            {step === 'content' && (
              <div className="space-y-6">
                <h2 className="font-heading font-bold text-xl text-gray-800 border-b pb-3">
                  Contenido del Trabajo
                </h2>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  <strong>Nota:</strong> Los campos de contenido son opcionales si adjunta el documento completo.
                  Si no sube un archivo, complete los campos principales.
                </div>

                {[
                  { field: 'introduction' as const, label: 'Introducción (1 a 1.5 páginas)', rows: 8 },
                  { field: 'methodology' as const, label: 'Método de Investigación (máximo 1 página)', rows: 6 },
                  { field: 'results' as const, label: 'Resultados (máximo 2 páginas)', rows: 8 },
                  { field: 'discussion' as const, label: 'Discusión (máximo 250 palabras)', rows: 5 },
                  { field: 'conclusions' as const, label: 'Conclusiones (máximo 1 página)', rows: 6 },
                  { field: 'bibliography' as const, label: 'Bibliografía (formato APA 7ma edición)', rows: 6 },
                ].map(({ field, label, rows }) => (
                  <div key={field}>
                    <label className="form-label">{label}</label>
                    <textarea rows={rows} className="form-input resize-y" {...register(field)} />
                  </div>
                ))}

                <div>
                  <label className="form-label">Adjuntar Documento (Word, máx. 15MB)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors">
                    <Upload size={32} className="mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500 text-sm mb-3">Arrastre su archivo aquí o haga clic para seleccionar</p>
                    <input type="file" accept=".doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="file-upload" />
                    <label htmlFor="file-upload" className="btn-outline btn-sm cursor-pointer inline-block">
                      Seleccionar Archivo
                    </label>
                    {file && (
                      <p className="mt-3 text-sm text-primary-600 font-medium flex items-center justify-center gap-2">
                        <CheckCircle size={16} />
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 4: Confirmar ──────────────────────────────────────── */}
            {step === 'confirm' && (
              <div className="space-y-6">
                <h2 className="font-heading font-bold text-xl text-gray-800 border-b pb-3">
                  Confirmar Postulación
                </h2>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
                  <p className="font-semibold text-amber-800 mb-2">⚠️ Antes de enviar, confirme que:</p>
                  <ul className="list-disc ml-4 text-amber-700 space-y-1">
                    <li>El índice de similitud/plagio es inferior al 8%</li>
                    <li>Se ha utilizado correctamente el formato APA 7ma edición</li>
                    <li>El trabajo no supera las 10 páginas incluyendo bibliografía</li>
                    <li>El uso de IA (si aplica) está debidamente citado</li>
                    <li>El correo del autor de correspondencia es correcto</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-semibold text-gray-600 mb-2">Título</p>
                    <p className="text-gray-800">{watch('titleEs')}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-semibold text-gray-600 mb-2">Tipos de Producto</p>
                    <ul className="text-gray-800 space-y-1">
                      {selectedProductTypeIds.map((id) => {
                        const pt = productTypes?.find((p) => p.id === id);
                        return <li key={id}>• {pt?.name ?? id}</li>;
                      })}
                    </ul>
                  </div>

                  {/* Resumen visual de autores con fotos */}
                  <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                    <p className="font-semibold text-gray-600 mb-3">Autores</p>
                    <div className="flex flex-wrap gap-4">
                      {watch('authors').map((a, i) => {
                        const photo = authorPhotos[i];
                        const preview = photo ? URL.createObjectURL(photo) : null;
                        return (
                          <div key={i} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-gray-200 min-w-[200px]">
                            {/* Mini avatar */}
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center">
                              {preview
                                ? <img src={preview} alt={a.fullName} className="w-full h-full object-cover" />
                                : <User size={18} className="text-gray-400" />
                              }
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 leading-tight">{a.fullName || `Autor ${i + 1}`}</p>
                              {a.isCorresponding && <span className="text-xs text-primary-600">correspondencia</span>}
                              {preview && <p className="text-xs text-green-600">📸 foto incluida</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {file && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="font-semibold text-gray-600 mb-2">Archivo adjunto</p>
                      <p className="text-gray-800">{file.name}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Navegación ────────────────────────────────────────────── */}
            <div className="flex justify-between pt-6 border-t mt-6">
              <button
                type="button"
                onClick={() => {
                  const order: Step[] = ['info', 'authors', 'content', 'confirm'];
                  const prev = order.indexOf(step) - 1;
                  if (prev >= 0) setStep(order[prev]);
                }}
                disabled={step === 'info'}
                className="btn-outline disabled:opacity-40"
              >
                Anterior
              </button>

              {step !== 'confirm' ? (
                <button type="button" onClick={handleNext} className="btn-primary">
                  Siguiente
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  className="btn-primary"
                  onClick={handleSubmit(onSubmit, (validationErrors) => {
                    console.error('[Submit] errores de validación Zod:', validationErrors);
                    toast.error('Hay campos inválidos. Revise el formulario.');
                  })}
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Postulación'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
