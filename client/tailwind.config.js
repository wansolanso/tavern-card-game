/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tavern: {
          dark: '#1a1410',
          wood: '#3d2817',
          gold: '#d4af37',
          bronze: '#cd7f32',
        },
        card: {
          common: '#9ca3af',
          uncommon: '#22c55e',
          rare: '#3b82f6',
          epic: '#a855f7',
          legendary: '#f97316',
        },
      },
      fontFamily: {
        medieval: ['Cinzel', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      animation: {
        'attack': 'attack 0.5s ease-in-out',
        'damage': 'damage 1s ease-out',
        'shake': 'shake 0.2s ease-in-out',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        attack: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(20px)' },
        },
        damage: {
          '0%': { transform: 'translateY(0) scale(0.5)', opacity: '1' },
          '100%': { transform: 'translateY(-50px) scale(1.2)', opacity: '0' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(212, 175, 55, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}
