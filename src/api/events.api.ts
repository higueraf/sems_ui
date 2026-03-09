import api from './axios';
import { ScientificEvent } from '../types';

export const eventsApi = {
  getActive: () =>
    api.get<ScientificEvent>('/events/active').then((r) => r.data),

  getPublic: (id: string) =>
    api.get<ScientificEvent>(`/events/${id}/public`).then((r) => r.data),

  getAll: () =>
    api.get<ScientificEvent[]>('/events').then((r) => r.data),

  getOne: (id: string) =>
    api.get<ScientificEvent>(`/events/${id}`).then((r) => r.data),

  create: (data: Partial<ScientificEvent>) =>
    api.post<ScientificEvent>('/events', data).then((r) => r.data),

  update: (id: string, data: Partial<ScientificEvent>) =>
    api.patch<ScientificEvent>(`/events/${id}`, data).then((r) => r.data),

  publishAgenda: (id: string) =>
    api.patch(`/events/${id}/publish-agenda`).then((r) => r.data),

  unpublishAgenda: (id: string) =>
    api.patch(`/events/${id}/unpublish-agenda`).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/events/${id}`).then((r) => r.data),
};
