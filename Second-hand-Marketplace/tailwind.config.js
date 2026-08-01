/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    'text-blue-600',
    'text-amber-600',
    'text-red-600',
    'text-emerald-600',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
