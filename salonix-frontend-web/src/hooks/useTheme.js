import { useContext } from 'react';
import ThemeContext from '../contexts/ThemeContext';

// Hook para usar o contexto de tema
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  
  return context;
};