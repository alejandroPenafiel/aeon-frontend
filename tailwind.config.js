/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['VT323', 'monospace'],
        'mono': ['VT323', 'monospace'],
      },
    },
  },
  plugins: [],
} 