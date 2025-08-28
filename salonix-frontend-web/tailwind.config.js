/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#6B7280', // botão / texto escuro
          light: '#F3F4F6', // fundo dos cards
          border: '#D1D5DB', // bordas de input/card
          hover: '#4B5563', // hover botão
        },
      },
    },
  },
  plugins: [],
};
