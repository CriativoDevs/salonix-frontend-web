import { createContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import client from '../api/client';
import { THEMES, getSystemTheme, resolveTheme } from '../constants/themes';

// Contexto do tema
const ThemeContext = createContext();

// Provider do contexto de tema
export const ThemeProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [theme, setTheme] = useState(THEMES.SYSTEM);
  const [resolvedTheme, setResolvedTheme] = useState(THEMES.LIGHT);
  const [isLoading, setIsLoading] = useState(true);

  // Aplica tema no DOM
  const applyTheme = useCallback((theme) => {
    const root = document.documentElement;
    const body = document.body;

    // Remove classes antigas
    body.removeAttribute('data-theme');
    root.classList.remove('theme-light', 'theme-dark');

    // Aplica novo tema usando data-theme
    body.setAttribute('data-theme', theme);

    // Paleta fixa do tema: sem aplicação de cores de branding (FEW-BRAND-01)

    // Atualiza meta theme-color para mobile
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const themeColor = theme === THEMES.DARK ? '#0f172a' : '#ffffff';
      metaThemeColor.setAttribute('content', themeColor);
    }
  }, []);

  // Carrega tema do usuário autenticado
  const loadUserTheme = useCallback(async () => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      const userTheme = user.theme_preference || THEMES.SYSTEM;
      setTheme(userTheme);
      const resolved = resolveTheme(userTheme);
      setResolvedTheme(resolved);
      applyTheme(resolved);
    } catch (error) {
      console.warn('Erro ao carregar tema do usuário:', error);
      // Fallback para tema do sistema
      const systemTheme = getSystemTheme();
      setTheme(THEMES.SYSTEM);
      setResolvedTheme(systemTheme);
      applyTheme(systemTheme);
    }
  }, [isAuthenticated, user, applyTheme]);

  // Salva tema no backend
  const saveThemeToBackend = async (newTheme) => {
    if (!isAuthenticated) {
      return;
    }

    try {
      await client.patch('users/me/profile/', {
        theme_preference: newTheme,
      });
    } catch (error) {
      console.error('Erro ao salvar tema no backend:', error);
      throw error;
    }
  };

  // Salva tema no localStorage como fallback
  const saveThemeToStorage = (newTheme) => {
    try {
      localStorage.setItem('theme-preference', newTheme);
    } catch (error) {
      console.warn('Erro ao salvar tema no localStorage:', error);
    }
  };

  // Carrega tema do localStorage
  const loadThemeFromStorage = () => {
    try {
      return localStorage.getItem('theme-preference') || THEMES.SYSTEM;
    } catch (error) {
      console.warn('Erro ao carregar tema do localStorage:', error);
      return THEMES.SYSTEM;
    }
  };

  // Função para alterar tema
  const changeTheme = async (newTheme) => {
    if (!Object.values(THEMES).includes(newTheme)) {
      console.error('Tema inválido:', newTheme);
      return;
    }

    try {
      setTheme(newTheme);
      const resolved = resolveTheme(newTheme);
      setResolvedTheme(resolved);
      applyTheme(resolved);

      // Salva no localStorage imediatamente
      saveThemeToStorage(newTheme);

      // Tenta salvar no backend se autenticado
      if (isAuthenticated) {
        await saveThemeToBackend(newTheme);
      }
    } catch (error) {
      console.error('Erro ao alterar tema:', error);
      // Em caso de erro, reverte para o tema anterior
      // mas mantém a mudança local
    }
  };

  // Listener para mudanças na preferência do sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = () => {
      if (theme === THEMES.SYSTEM) {
        const newResolvedTheme = getSystemTheme();
        setResolvedTheme(newResolvedTheme);
        applyTheme(newResolvedTheme);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme, applyTheme]);

  // Reaplica tema quando branding do tenant muda
  useEffect(() => {
    if (resolvedTheme) {
      applyTheme(resolvedTheme);
    }
  }, [resolvedTheme, applyTheme]);

  // Inicialização do tema
  useEffect(() => {
    const initializeTheme = async () => {
      setIsLoading(true);

      if (isAuthenticated && user) {
        // Usuário autenticado: carrega tema do backend
        await loadUserTheme();
      } else {
        // Usuário não autenticado: carrega do localStorage ou sistema
        const storedTheme = loadThemeFromStorage();
        setTheme(storedTheme);
        const resolved = resolveTheme(storedTheme);
        setResolvedTheme(resolved);
        applyTheme(resolved);
      }

      setIsLoading(false);
    };

    initializeTheme();
  }, [isAuthenticated, user, loadUserTheme, applyTheme]);

  const value = {
    theme,
    resolvedTheme,
    isLoading,
    changeTheme,
    themes: THEMES,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export default ThemeContext;
