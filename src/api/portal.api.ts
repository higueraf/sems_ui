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

  getMyCertificates: (submissionId: string): Promise<PortalCertificate[]> =>
    api.get(`/portal/submissions/${submissionId}/certificates`).then(r => r.data),

  getCertDownloadUrl: (certId: string, format: 'diploma' | 'carta' = 'diploma'): Promise<{ url: string; fileName: string }> =>
    api.get(`/portal/certificates/${certId}/download`, { params: { format } }).then(r => r.data),
};
