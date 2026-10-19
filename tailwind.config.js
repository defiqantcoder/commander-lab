/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mtg: {
          white: '#F9FAFB',
          blue: '#38BDF8',
          black: '#A855F7',
          red: '#EF4444',
          green: '#22C55E',
          colorless: '#94A3B8'
        }
      }
    }
  },
  plugins: []
};

