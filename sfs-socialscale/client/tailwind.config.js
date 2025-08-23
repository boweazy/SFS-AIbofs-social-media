/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'sf-dark': '#1a1a1a',
        'sf-gold': '#d4af37',
        'sf-gold-light': '#f4e29b',
      }
    },
  },
  plugins: [],
}