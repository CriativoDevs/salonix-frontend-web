// Temas disponíveis
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Função utilitária para detectar preferência do sistema
export const getSystemTheme = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? THEMES.DARK 
      : THEMES.LIGHT;
  }
  return THEMES.LIGHT;
};

// Função para resolver tema baseado na preferência
export const resolveTheme = (themePreference) => {
  if (themePreference === THEMES.SYSTEM) {
    return getSystemTheme();
  }
  return themePreference;
};