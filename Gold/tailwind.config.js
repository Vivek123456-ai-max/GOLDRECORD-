/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        trade: {
          profit: '#10b981',
          loss: '#ef4444',
          breakeven: '#94a3b8',
          buy: '#3b82f6',
          sell: '#f97316'
        },
        dark: {
          bg: '#0b0f19',
          card: '#111827',
          cardHover: '#1f2937',
          border: '#1e293b',
          subtle: '#334155'
        }
      },
    },
  },
  plugins: [],
}
