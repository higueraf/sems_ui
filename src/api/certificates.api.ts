import api from './axios';
import { Certificate } from '../types';

interface CertificateFilters {
  eventId?: string;
  productTypeId?: string;
  submissionId?: string;
  sent?: 'true' | 'false';
}

export const certificatesApi = {
  /** Lista certificados con filtros opcionales (admin) */
  getAll: (filters?: CertificateFilters) =>
    api.get<Certificate[]>('/certificates', { params: filters }).then((r) => r.data),

  /** Genera certificados PDF para todos los autores de una postulación + tipo de producto */
  generate: (submissionId: string, productTypeId: string) =>
    api.post<Certificate[]>('/certificates/generate', { submissionId, productTypeId }).then((r) => r.data),

  /** Envía los certificados indicados por email */
  send: (certificateIds: string[]) =>
    api.post<{ sent: number; failed: number }>('/certificates/send', { certificateIds }).then((r) => r.data),

  /** Genera y envía en un solo paso */
  generateAndSend: (submissionId: string, productTypeId: string) =>
    api.post<{ generated: number; sent: number; failed: number }>(
      '/certificates/generate-and-send',
      { submissionId, productTypeId },
    ).then((r) => r.data),

  /** Envío masivo para todas las postulaciones Ejecutadas de un evento */
  bulkGenerateAndSend: (eventId: string, productTypeId?: string) =>
    api.post<{ processed: number; generated: number; sent: number; failed: number }>(
      '/certificates/bulk-generate-and-send',
      { eventId, productTypeId },
    ).then((r) => r.data),

  /** URL firmada para re-descargar el PDF de un certificado */
  getDownloadUrl: (id: string) =>
    api.get<{ url: string; fileName: string }>(`/certificates/${id}/download`).then((r) => r.data),

  /** Verificación pública de certificado por código */
  verify: (code: string) =>
    api.get<{
      valid: boolean;
      certificateNumber: string;
      authorName: string;
      titleEs: string;
      productTypeName: string;
      eventName: string;
      issuedAt: string;
      emailSentAt?: string;
    }>(`/certificates/verify/${code}`).then((r) => r.data),

  /** Elimina un certificado (admin) */
  remove: (id: string) =>
    api.delete(`/certificates/${id}`).then((r) => r.data),
};
