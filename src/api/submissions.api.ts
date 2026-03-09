import api from './axios';
import { Submission, SubmissionStats, SubmissionStatus } from '../types';

interface SubmissionFilters {
  eventId?: string;
  status?: string;
  thematicAxisId?: string;
  search?: string;
}

export const submissionsApi = {
  create: (formData: FormData) =>
    api.post<Submission>('/submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  checkByEmail: (email: string) =>
    api.get<Submission[]>(`/submissions/check/${email}`).then((r) => r.data),

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

  sendEmail: (id: string, data: { subject: string; body: string }) =>
    api.post(`/submissions/admin/${id}/email`, data).then((r) => r.data),

  uploadAuthorPhoto: (authorId: string, file: File) => {
    const form = new FormData();
    form.append('photo', file);
    return api
      .post(`/submissions/authors/${authorId}/photo`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  removeAuthorPhoto: (authorId: string) =>
    api.patch(`/submissions/authors/${authorId}/photo/remove`).then((r) => r.data),

  /**
   * Obtiene una presigned URL temporal (1 hora) para descargar el manuscrito.
   * El archivo está en Backblaze B2 (privado) — no se puede acceder directo.
   */
  getDownloadUrl: (id: string) =>
    api.get<{ url: string; fileName: string }>(`/submissions/admin/${id}/download`).then((r) => r.data),
};
