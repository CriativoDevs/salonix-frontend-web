import { Sun, Moon } from 'lucide-react';

function SimpleThemeToggle({ isDark, onToggle, className = '' }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center justify-center rounded-full p-2 transition-colors ${
        isDark 
          ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' 
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      } ${className}`}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}

export default SimpleThemeToggle;