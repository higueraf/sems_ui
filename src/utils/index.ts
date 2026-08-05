import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { SubmissionStatus } from '../types';

export const formatDate = (dateStr: string, fmt = 'dd MMM yyyy') => {
  try {
    return format(parseISO(dateStr), fmt, { locale: es });
  } catch {
    return dateStr;
  }
};

export const formatTime = (timeStr: string) => timeStr?.substring(0, 5) || timeStr;

export const STATUS_CONFIG: Record<
  SubmissionStatus,
  { label: string; color: string; bgColor: string; textColor: string }
> = {
  received: { label: 'Recibida', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
  under_review: { label: 'En Revisión', color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
  revision_requested: { label: 'Revisión Requerida', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  approved: { label: 'Aprobada', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  rejected: { label: 'Rechazada', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
  withdrawn:          { label: 'Retirada',            color: 'gray',    bgColor: 'bg-gray-100',    textColor: 'text-gray-600'    },
  cancelled:          { label: 'Cancelada',           color: 'gray',    bgColor: 'bg-gray-200',    textColor: 'text-gray-700'    },
  scheduled:          { label: 'Programada',          color: 'teal',    bgColor: 'bg-teal-100',    textColor: 'text-teal-800'    },
  executed:           { label: 'Ejecutado',           color: 'emerald', bgColor: 'bg-emerald-100', textColor: 'text-emerald-800' },
  certificate_sent:   { label: 'Certificado Enviado', color: 'indigo',  bgColor: 'bg-indigo-100',  textColor: 'text-indigo-800'  },
};

export const SLOT_TYPE_LABELS: Record<string, string> = {
  keynote: 'Conferencia Magistral',
  presentation: 'Presentación',
  break: 'Receso / Almuerzo',
  ceremony: 'Ceremonia',
  workshop: 'Taller',
  panel: 'Panel',
};

export const ORGANIZER_ROLE_LABELS: Record<string, string> = {
  host: 'Institución Anfitriona',
  co_organizer: 'Co-organizador',
  sponsor: 'Patrocinador',
  scientific_committee: 'Comité Científico',
  organizing_committee: 'Comité Organizador',
  keynote_speaker: 'Conferencista Magistral',
  contact: 'Contacto',
};

export const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(' ');

/** Etiquetas legibles para el formato de un evento (presencial / virtual / híbrido). */
export const EVENT_FORMAT_LABELS: Record<string, string> = {
  in_person: 'Presencial',
  online: 'Virtual',
  hybrid: 'Híbrida',
};

/** Deriva "Ciudad, País" (o el campo location como respaldo) de un evento. */
export const getEventLocationLabel = (
  event?: { city?: string; country?: string; location?: string } | null,
): string => {
  if (!event) return '';
  return [event.city, event.country].filter(Boolean).join(', ') || event.location || '';
};

/**
 * Formatea el rango de fechas de un evento, ej: "23–27 de noviembre" + año "2026".
 * Devuelve null si no hay fecha de inicio disponible.
 */
export const formatEventDateRange = (
  startDate?: string | null,
  endDate?: string | null,
): { dayLabel: string; year: string } | null => {
  if (!startDate) return null;
  try {
    const start = parseISO(startDate);
    const end = endDate ? parseISO(endDate) : start;
    const startDay = format(start, 'd');
    const endDay = format(end, 'd');
    const sameMonth = format(start, 'MM-yyyy') === format(end, 'MM-yyyy');
    const month = format(start, 'MMMM', { locale: es });
    const dayLabel = sameMonth
      ? (startDay === endDay ? `${startDay} de ${month}` : `${startDay}–${endDay} de ${month}`)
      : `${startDay} ${format(start, 'MMM', { locale: es })} – ${endDay} ${format(end, 'MMM', { locale: es })}`;
    return { dayLabel, year: format(start, 'yyyy') };
  } catch {
    return null;
  }
};

/**
 * Resuelve una URL de imagen almacenada.
 * - URLs de Cloudinary (https://res.cloudinary.com/...): se devuelven tal cual.
 * - Referencias B2 (b2://...): NO son URLs públicas — usar storage.getSignedUrl() en el backend.
 * - Referencias locales (local://...): se convierten a URLs del API local-files
 * - Rutas legadas /uploads/...: se convierten al origen del API
 */
const API_ORIGIN = ((import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api$/, '');
export const getFileUrl = (path?: string | null): string => {
  if (!path) return '';
  
  // URL absoluta (Cloudinary CDN u otra): devolver directamente
  if (path.startsWith('http')) return path;
  
  // Referencia interna B2 — no es una URL pública, no se puede mostrar directamente
  if (path.startsWith('b2://')) return '';
  
  // Referencia local (local://folder/file): convertir a API endpoint
  if (path.startsWith('local://')) {
    const relativePath = path.replace('local://', '');
    const [folder] = relativePath.split('/');
    
    // Carpetas públicas son accesibles sin autenticación
    const publicFolders = ['logos', 'photos', 'guidelines'];
    const visibility = publicFolders.includes(folder) ? 'public' : 'private';
    
    return `${API_ORIGIN}/api/local-files/${visibility}/${relativePath}`;
  }
  
  // Ruta legada /uploads/... (compatibilidad)
  return `${API_ORIGIN}${path}`;
};
