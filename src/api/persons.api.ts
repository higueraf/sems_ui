import api from './axios';
import type { Person } from '../types';

export const personsApi = {
  search: (q: string): Promise<Person[]> =>
    api.get('/persons/search', { params: { q } }).then(r => r.data),
};
