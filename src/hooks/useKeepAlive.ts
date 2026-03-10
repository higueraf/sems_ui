/**
 * useKeepAlive.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Hace ping al backend cada 10 min SIEMPRE — incluso con el tab en background.
 *
 * PROBLEMA ORIGINAL:
 *   El hook pausaba el ping cuando el tab quedaba en background (visibilitychange).
 *   Esto permitía que Render durmiera el servicio si nadie tenía el tab activo.
 *
 * SOLUCIÓN:
 *   - setInterval sin pausas por visibilidad (el timer sigue en background)
 *   - Ping adicional al volver al tab (por si hubo cold start mientras estaba oculto)
 *   - Manejo silencioso de errores (no rompe la UX si el ping falla)
 */
import { useEffect, useRef } from 'react';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';
const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 min — Render duerme a los 15 min

export function useKeepAlive() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ping = async () => {
    try {
      await fetch(`${API_URL}/health/ping`, {
        method: 'GET',
        signal: AbortSignal.timeout(10_000), // 10s timeout
      });
      if ((import.meta as any).env?.DEV) {
        console.debug('[KeepAlive] ✅ ping ok →', new Date().toLocaleTimeString());
      }
    } catch {
      if ((import.meta as any).env?.DEV) {
        console.warn('[KeepAlive] ⚠️ ping falló (sin conexión o cold start)');
      }
    }
  };

  useEffect(() => {
    // Ping inmediato al montar — despierta Render si estaba dormido
    ping();

    // Timer continuo — NO se pausa en background
    timerRef.current = setInterval(ping, PING_INTERVAL_MS);

    // Ping extra al volver al tab — el servicio pudo haberse dormido
    // durante el tiempo que el usuario estuvo en otra pestaña
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        ping();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);
}
