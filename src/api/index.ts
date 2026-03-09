import api from './axios';
import { Country, Organizer, OrganizerMember, Guideline, ThematicAxis, ScientificProductType, User, EventPageSection } from '../types';

export const countriesApi = {
  getAll: (active?: boolean) =>
    api.get<Country[]>('/countries', { params: active ? { active: 'true' } : {} }).then((r) => r.data),
  create: (data: Partial<Country>) =>
    api.post<Country>('/countries', data).then((r) => r.data),
  update: (id: string, data: Partial<Country>) =>
    api.patch<Country>(`/countries/${id}`, data).then((r) => r.data),
  remove: (id: string) =>
    api.delete(`/countries/${id}`).then((r) => r.data),
};

export const organizersApi = {
  // ─ Instituciones
  getPublic: (eventId: string) =>
    api.get<Organizer[]>('/organizers', { params: { eventId } }).then((r) => r.data),
  getAll: (eventId: string) =>
    api.get<Organizer[]>('/organizers/admin', { params: { eventId } }).then((r) => r.data),
  getOne: (id: string) =>
    api.get<Organizer>(`/organizers/admin/${id}`).then((r) => r.data),
  create: (data: Partial<Organizer>) =>
    api.post<Organizer>('/organizers', data).then((r) => r.data),
  update: (id: string, data: Partial<Organizer>) =>
    api.patch<Organizer>(`/organizers/${id}`, data).then((r) => r.data),
  uploadLogo: (id: string, file: File) => {
    const form = new FormData();
    form.append('logo', file);
    return api
      .post<Organizer>(`/organizers/${id}/logo`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
  uploadPhoto: (id: string, file: File) => {
    const form = new FormData();
    form.append('photo', file);
    return api
      .post<Organizer>(`/organizers/${id}/photo`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
  remove: (id: string) =>
    api.delete(`/organizers/${id}`).then((r) => r.data),

  // ─ Miembros de una institución
  getMembers: (organizerId: string) =>
    api.get<OrganizerMember[]>(`/organizers/${organizerId}/members`).then((r) => r.data),
  createMember: (organizerId: string, data: Partial<OrganizerMember>) =>
    api.post<OrganizerMember>(`/organizers/${organizerId}/members`, data).then((r) => r.data),
  updateMember: (id: string, data: Partial<OrganizerMember>) =>
    api.patch<OrganizerMember>(`/organizers/members/${id}`, data).then((r) => r.data),
  uploadMemberPhoto: (id: string, file: File) => {
    const form = new FormData();
    form.append('photo', file);
    return api
      .post<OrganizerMember>(`/organizers/members/${id}/photo`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
  removeMember: (id: string) =>
    api.delete(`/organizers/members/${id}`).then((r) => r.data),
};

export const guidelinesApi = {
  getPublic: (eventId: string) =>
    api.get<Guideline[]>('/guidelines', { params: { eventId } }).then((r) => r.data),
  getAll: (eventId: string) =>
    api.get<Guideline[]>('/guidelines/admin', { params: { eventId } }).then((r) => r.data),
  create: (data: Partial<Guideline>) =>
    api.post<Guideline>('/guidelines', data).then((r) => r.data),
  update: (id: string, data: Partial<Guideline>) =>
    api.patch<Guideline>(`/guidelines/${id}`, data).then((r) => r.data),
  remove: (id: string) =>
    api.delete(`/guidelines/${id}`).then((r) => r.data),
  /** Sube un archivo adjunto (PDF/PPTX/DOCX) a una pauta */
  uploadFile: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post<Guideline>(`/guidelines/${id}/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
  /** Elimina el archivo adjunto de una pauta */
  removeFile: (id: string) =>
    api.delete(`/guidelines/${id}/upload`).then((r) => r.data),

  /**
   * Obtiene una presigned URL temporal (1 hora) para descargar el archivo adjunto.
   * Necesario porque los archivos están en Backblaze B2 (privado).
   */
  getDownloadUrl: (id: string) =>
    api.get<{ url: string; fileName: string }>(`/guidelines/${id}/download`).then((r) => r.data),
};

export const thematicAxesApi = {
  getPublic: (eventId: string) =>
    api.get<ThematicAxis[]>('/thematic-axes', { params: { eventId } }).then((r) => r.data),
  getAll: (eventId: string) =>
    api.get<ThematicAxis[]>('/thematic-axes/admin', { params: { eventId } }).then((r) => r.data),
  create: (data: Partial<ThematicAxis>) =>
    api.post<ThematicAxis>('/thematic-axes', data).then((r) => r.data),
  update: (id: string, data: Partial<ThematicAxis>) =>
    api.patch<ThematicAxis>(`/thematic-axes/${id}`, data).then((r) => r.data),
  remove: (id: string) =>
    api.delete(`/thematic-axes/${id}`).then((r) => r.data),
};

export const productTypesApi = {
  getAll: (active?: boolean) =>
    api.get<ScientificProductType[]>('/scientific-product-types', {
      params: active ? { active: 'true' } : {},
    }).then((r) => r.data),
  create: (data: Partial<ScientificProductType>) =>
    api.post<ScientificProductType>('/scientific-product-types', data).then((r) => r.data),
  update: (id: string, data: Partial<ScientificProductType>) =>
    api.patch<ScientificProductType>(`/scientific-product-types/${id}`, data).then((r) => r.data),
  remove: (id: string) =>
    api.delete(`/scientific-product-types/${id}`).then((r) => r.data),
};

export const usersApi = {
  getAll: () =>
    api.get<User[]>('/admin/users').then((r) => r.data),
  create: (data: { email: string; password: string; firstName: string; lastName: string; role: string }) =>
    api.post<User>('/admin/users', data).then((r) => r.data),
  update: (id: string, data: Partial<User & { password?: string }>) =>
    api.patch<User>(`/admin/users/${id}`, data).then((r) => r.data),
  remove: (id: string) =>
    api.delete(`/admin/users/${id}`).then((r) => r.data),
};

export const pageSectionsApi = {
  getPublic: (eventId: string, key?: string) =>
    api.get<EventPageSection[]>('/page-sections', { params: { eventId, key } }).then((r) => r.data),
  getAll: (eventId: string) =>
    api.get<EventPageSection[]>('/page-sections/admin', { params: { eventId } }).then((r) => r.data),
  create: (data: Partial<EventPageSection>) =>
    api.post<EventPageSection>('/page-sections', data).then((r) => r.data),
  update: (id: string, data: Partial<EventPageSection>) =>
    api.patch<EventPageSection>(`/page-sections/${id}`, data).then((r) => r.data),
  remove: (id: string) =>
    api.delete(`/page-sections/${id}`).then((r) => r.data),
};
