/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'playfair': ['Playfair Display', 'serif'],
        'alex-brush': ['Alex Brush', 'cursive'],
      }, 
      colors: {
        'accent': '#b5a49b',
      }
    },
  },
  plugins: [],
};
