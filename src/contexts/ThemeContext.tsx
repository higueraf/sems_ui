import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'light';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  isDark: false,
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return 'light'; // Siempre tema claro
  });

  useEffect(() => {
    const root = document.documentElement;
    // Siempre remover clase dark y mantener tema claro
    root.classList.remove('dark');
    localStorage.setItem('sems-theme', theme);
  }, [theme]);

  const toggle = () => {
    // Toggle ya no hace nada, siempre mantiene light
    console.log('El tema siempre es claro');
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark: false, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
