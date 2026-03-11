import api from './axios';
import { Submission, SubmissionFile, SubmissionStats, SubmissionStatus } from '../types';

interface SubmissionFilters {
  eventId?: string;
  status?: string;
  thematicAxisId?: string;
  search?: string;
}

export const submissionsApi = {
  // ── Público ────────────────────────────────────────────────────────────────
  create: (formData: FormData) =>
    api.post<Submission>('/submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  checkByEmail: (email: string) =>
    api.get<Submission[]>(`/submissions/check/${email}`).then((r) => r.data),

  // ── Admin ──────────────────────────────────────────────────────────────────
  getAll: (filters: SubmissionFilters) =>
    api.get<Submission[]>('/submissions/admin', { params: filters }).then((r) => r.data),

  getStats: (eventId: string) =>
    api.get<SubmissionStats>('/submissions/admin/stats', { params: { eventId } }).then((r) => r.data),

  getOne: (id: string) =>
    api.get<Submission>(`/submissions/admin/${id}`).then((r) => r.data),

  getHistory: (id: string) =>
    api.get(`/submissions/admin/${id}/history`).then((r) => r.data),

  changeStatus: (
    id: string,
    data: { newStatus: SubmissionStatus; notes?: string; internalNotes?: string; notifyApplicant?: boolean },
  ) =>
    api.patch<Submission>(`/submissions/admin/${id}/status`, data).then((r) => r.data),

  assignEvaluator: (id: string, evaluatorId: string) =>
    api.patch(`/submissions/admin/${id}/assign-evaluator`, { evaluatorId }).then((r) => r.data),

  // ── Descarga del documento activo ─────────────────────────────────────────
  getDownloadUrl: (id: string) =>
    api.get<{ url: string; fileName: string }>(`/submissions/admin/${id}/download`).then((r) => r.data),

  // ── Historial de versiones del documento ──────────────────────────────────
  getFileHistory: (id: string) =>
    api.get<SubmissionFile[]>(`/submissions/admin/${id}/files`).then((r) => r.data),

  /**
   * Sube una nueva versión del documento desde el dashboard.
   * La nueva versión queda como oficial automáticamente.
   */
  addFileVersion: (
    id: string,
    file: File,
    fileType: 'manuscript' | 'correction' | 'final' = 'correction',
    notes?: string,
  ) => {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('fileType', fileType);
    if (notes) form.append('notes', notes);
    return api.post<SubmissionFile>(`/submissions/admin/${id}/files`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  /** Promueve una versión anterior a oficial */
  setActiveFileVersion: (submissionId: string, fileId: string) =>
    api.patch<SubmissionFile>(
      `/submissions/admin/files/${fileId}/activate`,
      null,
      { params: { submissionId } },
    ).then((r) => r.data),

  /** Descarga una versión específica del historial */
  getFileVersionDownloadUrl: (fileId: string) =>
    api.get<{ url: string; fileName: string }>(
      `/submissions/admin/files/${fileId}/download`,
    ).then((r) => r.data),

  // ── Documentos de identidad ────────────────────────────────────────────────
  getAuthorIdDocUrl: (authorId: string) =>
    api.get<{ url: string | null; authorName: string; fileName?: string }>(
      `/submissions/authors/${authorId}/id-doc/download`,
    ).then((r) => r.data),

  /** Reemplaza el doc. de identidad de un autor (PDF) desde el dashboard */
  replaceAuthorIdDoc: (authorId: string, file: File) => {
    const form = new FormData();
    form.append('file', file, file.name);
    return api.post(`/submissions/authors/${authorId}/id-doc`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  // ── Fotos de autores ───────────────────────────────────────────────────────
  uploadAuthorPhoto: (authorId: string, file: File) => {
    const form = new FormData();
    form.append('photo', file);
    return api.post(`/submissions/authors/${authorId}/photo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  removeAuthorPhoto: (authorId: string) =>
    api.patch(`/submissions/authors/${authorId}/photo/remove`).then((r) => r.data),

  // ── Correos ────────────────────────────────────────────────────────────────
  /** Correo con adjunto Word opcional (base64) */
  sendEmail: (
    id: string,
    data: { subject: string; body: string; attachmentBase64?: string; attachmentName?: string },
  ) =>
    api.post(`/submissions/admin/${id}/email`, data).then((r) => r.data),

  /** Correo con adjunto Word como archivo real (multipart) */
  sendEmailWithAttachment: (
    id: string,
    subject: string,
    body: string,
    attachment?: File,
  ) => {
    const form = new FormData();
    form.append('subject', subject);
    form.append('body', body);
    if (attachment) form.append('attachment', attachment, attachment.name);
    return api.post(`/submissions/admin/${id}/email/attachment`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  sendBulkEmail: (data: {
    subject: string;
    body: string;
    eventId: string;
    status?: string;
    attachmentBase64?: string;
    attachmentName?: string;
  }) =>
    api.post<{ queued: number; message: string }>('/submissions/admin/bulk-email', data).then((r) => r.data),
};
