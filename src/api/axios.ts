import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sems_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || 'Error de servidor';

    if (status === 401) {
      localStorage.removeItem('sems_token');
      localStorage.removeItem('sems_user');
      if (!window.location.pathname.includes('/dashboard/login')) {
        window.location.href = '/dashboard/login';
      }
    } else if (status === 403) {
      toast.error('No tiene permisos para realizar esta acción');
    } else if (status >= 500) {
      toast.error('Error interno del servidor. Intente de nuevo.');
    }

    return Promise.reject(error);
  },
);

export default api;
