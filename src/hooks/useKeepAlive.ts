/**
 * useKeepAlive.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Hook que hace un ping al backend cada N minutos para evitar el spin-down
 * de Render (el plan gratuito suspende instancias tras ~15 min de inactividad).
 *
 * Estrategia:
 *  - Ping cada 10 minutos mientras el tab está visible
 *  - Pausa automáticamente cuando el tab queda en background (visibilitychange)
 *  - Reactiva al volver al tab
 *  - No emite errores visibles al usuario — solo log en consola dev
 */
import { useEffect, useRef } from 'react';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';
const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutos

export function useKeepAlive() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ping = async () => {
    try {
      await fetch(`${API_URL}/health/ping`, {
        method: 'GET',
        signal: AbortSignal.timeout(8000), // timeout 8s
      });
      if ((import.meta as any).env?.DEV) {
        console.debug('[KeepAlive] ping ok →', new Date().toLocaleTimeString());
      }
    } catch {
      // Silencioso en producción
      if ((import.meta as any).env?.DEV) {
        console.warn('[KeepAlive] ping falló');
      }
    }
  };

  const start = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(ping, PING_INTERVAL_MS);
  };

  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    // Ping inmediato al montar (despierta Render si está dormido)
    ping();
    start();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        ping(); // ping inmediato al volver
        start();
      } else {
        stop();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);
}
