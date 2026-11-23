/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#0D1117',
        card: '#161B22',
        primary: '#2A9D8F',
        ticket: '#E76F51',
        text: '#F8F9FA',
        muted: '#94A3B8',
        border: '#30363D',
      },
    },
  },
  plugins: [],
};
