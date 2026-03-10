import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.store';

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Interceptor de REQUEST:
 * Lee el token directamente del store de Zustand (que a su vez
 * lo sincroniza con localStorage). Esto garantiza que siempre
 * se use el token más actualizado del estado reactivo.
 */
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Interceptor de RESPONSE:
 * - 401 → logout limpio + redirige al login (sin loop si ya estamos ahí)
 * - 403 → notificación de permisos insuficientes
 * - 5xx → notificación genérica de servidor
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || 'Error de servidor';

    if (status === 401) {
      // Logout limpio a través del store (limpia estado + localStorage)
      useAuthStore.getState().logout();
      if (!window.location.pathname.includes('/dashboard/login')) {
        window.location.href = '/dashboard/login';
      }
    } else if (status === 403) {
      toast.error('No tiene permisos para realizar esta acción');
    } else if (status >= 500) {
      toast.error(`Error interno del servidor: ${message}`);
    }

    return Promise.reject(error);
  },
);

export default api;
