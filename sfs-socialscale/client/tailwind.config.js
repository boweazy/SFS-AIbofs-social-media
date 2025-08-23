/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sf-dark': '#1a1a1a',
        'sf-darker': '#0f0f0f', 
        'sf-gold': '#ffd700',
        'sf-gold-dark': '#b8860b',
        'sf-gray': '#333333',
        'sf-gray-light': '#555555'
      }
    },
  },
  plugins: [],
}