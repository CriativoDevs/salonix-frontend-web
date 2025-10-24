/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--accent-primary)',
          surface: 'var(--bg-primary)',
          light: 'var(--bg-secondary)',
          border: 'var(--border-primary)',
          hover: 'var(--accent-hover)',
          accent: 'var(--accent-hover)',
          foreground: 'var(--text-primary)',
          surfaceForeground: 'var(--text-primary)',
        },
      },
    },
  },
  plugins: [],
};
