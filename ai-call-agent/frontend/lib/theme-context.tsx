'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  const applyTheme = (mode: ThemeMode) => {
    if (typeof window === 'undefined') return;

    let target: 'light' | 'dark' = 'dark';

    if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      target = prefersDark ? 'dark' : 'light';
    } else {
      target = mode;
    }

    setResolvedTheme(target);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(target);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = (localStorage.getItem('theme_preference') as ThemeMode) || 'system';
      setThemeState(saved);
      applyTheme(saved);

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const currentSaved = (localStorage.getItem('theme_preference') as ThemeMode) || 'system';
        if (currentSaved === 'system') {
          applyTheme('system');
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const setTheme = (newMode: ThemeMode) => {
    setThemeState(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme_preference', newMode);
    }
    applyTheme(newMode);
  };

  const toggleTheme = () => {
    const next: ThemeMode = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
