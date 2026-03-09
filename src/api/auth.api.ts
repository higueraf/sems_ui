import api from './axios';
import { User } from '../types';

interface LoginResponse {
  accessToken: string;
  user: User;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data),

  getProfile: () =>
    api.get<User>('/auth/me').then((r) => r.data),
};
