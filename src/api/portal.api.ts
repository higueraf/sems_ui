import api from './axios';
import type { PortalSubmissionSummary, PortalCertificate } from '../types';

export const portalApi = {
  getMySubmissions: (): Promise<PortalSubmissionSummary[]> =>
    api.get('/portal/submissions').then(r => r.data),

  getMySubmission: (id: string): Promise<any> =>
    api.get(`/portal/submissions/${id}`).then(r => r.data),

  uploadRevision: (id: string, file: File, notes?: string): Promise<{ id: string; version: number; fileName: string }> => {
    const form = new FormData();
    form.append('file', file, file.name);
    if (notes) form.append('notes', notes);
    return api.post(`/portal/submissions/${id}/revision`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  updateSubmission: (id: string, data: Record<string, string>): Promise<any> =>
    api.patch(`/portal/submissions/${id}`, data).then(r => r.data),

  addAuthor: (submissionId: string, data: Record<string, any>): Promise<any> =>
    api.post(`/portal/submissions/${submissionId}/authors`, data).then(r => r.data),

  removeAuthor: (submissionId: string, authorId: string): Promise<any> =>
    api.delete(`/portal/submissions/${submissionId}/authors/${authorId}`).then(r => r.data),

  getMyCertificates: (submissionId: string): Promise<PortalCertificate[]> =>
    api.get(`/portal/submissions/${submissionId}/certificates`).then(r => r.data),

  getAllMyCertificates: (): Promise<PortalCertificate[]> =>
    api.get('/portal/certificates').then(r => r.data),

  getCertDownloadUrl: (certId: string, format: 'diploma' | 'carta' = 'diploma'): Promise<{ url: string; fileName: string }> =>
    api.get(`/portal/certificates/${certId}/download`, { params: { format } }).then(r => r.data),

  getAccount: (): Promise<{ firstName: string; lastName: string; email: string }> =>
    api.get('/portal/account').then(r => r.data),

  updateAccount: (data: { firstName: string; lastName: string }) =>
    api.patch('/portal/account', data).then(r => r.data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.patch('/portal/account/password', data).then(r => r.data),
};
