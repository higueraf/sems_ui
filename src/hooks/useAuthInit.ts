/**
 * useAuthInit.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Hook que se ejecuta una sola vez al montar la aplicación.
 *
 * Responsabilidades:
 *  1. Esperar a que Zustand termine la rehidratación desde localStorage.
 *  2. Si hay token persistido, validarlo contra GET /auth/me.
 *     - Token válido  → actualiza el usuario (puede haber cambiado en el servidor)
 *                       y marca isAuthenticated = true
 *     - Token inválido / expirado → hace logout limpio
 *  3. Si no hay token → simplemente desactiva isInitializing.
 *
 * Esto garantiza:
 *  - Recarga de página: la sesión se mantiene sin parpadeo al login.
 *  - Nuevo tab: comparte el localStorage → mismo comportamiento.
 *  - Token expirado: redirige correctamente al login.
 */
import { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../api/auth.api';

export function useAuthInit() {
  const { token, setAuth, logout, setInitializing } = useAuthStore();

  useEffect(() => {
    // Zustand persist rehidrata de forma síncrona en v4+,
    // pero usamos un micro-task para garantizar que el store esté listo.
    const init = async () => {
      if (!token) {
        // Sin token → no hay sesión activa
        setInitializing(false);
        return;
      }

      try {
        // Verificamos el token con el backend
        const user = await authApi.getProfile();
        // Token válido: refrescamos el usuario en el store
        setAuth(user, token);
      } catch {
        // Token inválido, expirado o usuario desactivado → logout limpio
        logout();
      }
    };

    init();
    // Solo se ejecuta al montar (token del store inicial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
