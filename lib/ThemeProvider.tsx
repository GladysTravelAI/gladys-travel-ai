'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme:         Theme;
  resolvedTheme: 'light' | 'dark';   // what's actually applied right now
  setTheme:      (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme:         'system',
  resolvedTheme: 'light',
  setTheme:      () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme,         setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolved]   = useState<'light' | 'dark'>('light');

  // On mount: read saved preference
  useEffect(() => {
    const saved = localStorage.getItem('gladys-theme') as Theme | null;
    if (saved) setThemeState(saved);
  }, []);

  // Whenever theme changes: apply .dark class to <html> and persist
  useEffect(() => {
    const apply = (t: Theme) => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = t === 'dark' || (t === 'system' && prefersDark);
      document.documentElement.classList.toggle('dark', isDark);
      setResolved(isDark ? 'dark' : 'light');
    };

    apply(theme);
    localStorage.setItem('gladys-theme', theme);

    // If system, watch for OS changes
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => apply('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}