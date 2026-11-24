/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 950: '#06142a', 900: '#0b1f3a', 800: '#12305a', 700: '#1b4275', 600: '#2a5a96', 100: '#e3eaf4', 50: '#f3f6fb' },
        teal: { 700: '#0b6e6e', 600: '#0f8a88', 500: '#14a39f', 400: '#3cbdb8', 100: '#d5f1ef', 50: '#ecf9f8' },
        gold: { 600: '#a8811f', 500: '#c49a2c', 400: '#d8b456', 100: '#f7eed5' },
      },
      fontFamily: {
        sans: ['Inter', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        arabic: ['"IBM Plex Sans Arabic"', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
