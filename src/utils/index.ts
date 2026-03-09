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
  withdrawn: { label: 'Retirada', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-600' },
  scheduled: { label: 'Programada', color: 'teal', bgColor: 'bg-teal-100', textColor: 'text-teal-800' },
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

/** Converts a relative /uploads/... path to the full backend URL */
const API_ORIGIN = ((import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api$/, '');
export const getFileUrl = (path?: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_ORIGIN}${path}`;
};
