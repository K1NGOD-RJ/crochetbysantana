/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#7B5EA7',
        dark: '#4A2D82',
        gold: '#D4AA50',
        lavender: '#F5F0FF',
        'c-border': '#C4B0DC',
        'c-text': '#3D2B69',
        hover: '#EFE6FF',
        'c-bg': '#FAFAFE',
        mid: '#9B87BF',
      },
    },
  },
  plugins: [],
}
