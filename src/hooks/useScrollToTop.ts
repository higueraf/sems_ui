import { useEffect } from 'react';

/**
 * Hook para hacer scroll automático al principio de la página
 * Útil para páginas de navegación principal
 */
export function useScrollToTop() {
  useEffect(() => {
    // Scroll suave al principio de la página
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, []);
}
