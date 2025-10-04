/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mainblack: '#191919',
        mainwhite: '#ffffff',
        mainash: '#6b7280',
      },
    },
  },
  plugins: [],
}