/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f4ed',
          100: '#c0e4cf',
          200: '#96d3b0',
          300: '#6bc190',
          400: '#4db478',
          500: '#007F3A',
          600: '#006f33',
          700: '#005c2a',
          800: '#004a21',
          900: '#003918',
          DEFAULT: '#007F3A',
        },
        accent: {
          50: '#fce4ec',
          100: '#f9bccf',
          200: '#f590b0',
          300: '#f06490',
          400: '#ec4278',
          500: '#E60553',
          600: '#cc044a',
          700: '#a3033b',
          800: '#7a022c',
          900: '#52011e',
          DEFAULT: '#E60553',
        },
        dark: '#1a1a2e',
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        body: ['Roboto', 'sans-serif'],
      },
      boxShadow: {
        natural: '6px 6px 9px rgba(0,0,0,0.2)',
        deep: '12px 12px 50px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
};
