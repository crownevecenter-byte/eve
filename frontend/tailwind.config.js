/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#fff4ed',
          100: '#ffeadb',
          200: '#ffd0b8',
          300: '#ffab8a',
          400: '#ff7752',
          500: '#e8470a', // New Primary
          600: '#c73a08', // New Hover
          700: '#a32b0a',
          800: '#81240f',
          900: '#692011',
          950: '#390c06',
        },
      },
    },
  },
  plugins: [],
}
