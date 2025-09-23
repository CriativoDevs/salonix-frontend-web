/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary, #6B7280)', // botão / texto escuro
          light: 'var(--brand-surface, #F3F4F6)', // fundo dos cards
          border: 'var(--brand-border, #D1D5DB)', // bordas de input/card
          hover: 'var(--brand-accent, #4B5563)', // hover botão
          foreground: 'var(--brand-on-primary, #FFFFFF)',
          surfaceForeground: 'var(--brand-on-surface, #1F2937)',
        },
      },
    },
  },
  plugins: [],
};
