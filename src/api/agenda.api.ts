import api from './axios';
import { AgendaSlot } from '../types';

export const agendaApi = {
  getPublic: (eventId: string) =>
    api.get<AgendaSlot[]>('/agenda/public', { params: { eventId } }).then((r) => r.data),

  getAll: (eventId: string) =>
    api.get<AgendaSlot[]>('/agenda', { params: { eventId } }).then((r) => r.data),

  getDays: (eventId: string) =>
    api.get<{ day: string }[]>('/agenda/days', { params: { eventId } }).then((r) => r.data),

  create: (data: Partial<AgendaSlot>) =>
    api.post<AgendaSlot>('/agenda', data).then((r) => r.data),

  update: (id: string, data: Partial<AgendaSlot>) =>
    api.patch<AgendaSlot>(`/agenda/${id}`, data).then((r) => r.data),

  remove: (id: string, body: { reason: string; revertStatus?: string }) =>
    api.delete(`/agenda/${id}`, { data: body }).then((r) => r.data),

  reorder: (orderedIds: string[]) =>
    api.patch('/agenda/reorder', { orderedIds }).then((r) => r.data),

  publish: (id: string) =>
    api.patch(`/agenda/${id}/publish`).then((r) => r.data),

  unpublish: (id: string) =>
    api.patch(`/agenda/${id}/unpublish`).then((r) => r.data),

  publishAll: (eventId: string) =>
    api.patch('/agenda/publish-all', {}, { params: { eventId } }).then((r) => r.data),

  getEligibleSubmissions: (eventId: string) =>
    api.get('/agenda/eligible-submissions', { params: { eventId } }).then((r) => r.data),
};
