import api from './axios';
import { ScientificEvent, EventVideo, Workshop } from '../types';

export const eventsApi = {
  getActive: () =>
    api.get<ScientificEvent>('/events/active').then((r) => r.data),

  getPublic: (id: string) =>
    api.get<ScientificEvent>(`/events/${id}/public`).then((r) => r.data),

  getPrevious: () =>
    api.get<ScientificEvent[]>('/events/previous').then((r) => r.data),

  getWorkshops: () =>
    api.get<ScientificEvent[]>('/events/workshops').then((r) => r.data),

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

  // ── Videos YouTube ──────────────────────────────────────────────────────────

  getVideos: (eventId: string) =>
    api.get<EventVideo[]>(`/events/${eventId}/videos`).then((r) => r.data),

  addVideo: (eventId: string, data: Omit<EventVideo, 'id' | 'eventId' | 'createdAt'>) =>
    api.post<EventVideo>(`/events/${eventId}/videos`, data).then((r) => r.data),

  updateVideo: (videoId: string, data: Partial<Omit<EventVideo, 'id' | 'eventId' | 'createdAt'>>) =>
    api.patch<EventVideo>(`/events/videos/${videoId}`, data).then((r) => r.data),

  removeVideo: (videoId: string) =>
    api.delete(`/events/videos/${videoId}`).then((r) => r.data),

  // ---- Talleres ----
  getWorkshopsByEvent: (eventId: string) =>
    api.get<Workshop[]>(`/events/${eventId}/workshops`).then((r) => r.data),

  addWorkshop: (eventId: string, data: Omit<Workshop, 'id' | 'eventId' | 'createdAt'>) =>
    api.post<Workshop>(`/events/${eventId}/workshops`, data).then((r) => r.data),

  updateWorkshop: (workshopId: string, data: Partial<Omit<Workshop, 'id' | 'eventId' | 'createdAt'>>) =>
    api.patch<Workshop>(`/events/workshops/${workshopId}`, data).then((r) => r.data),

  removeWorkshop: (workshopId: string) =>
    api.delete(`/events/workshops/${workshopId}`).then((r) => r.data),
};
