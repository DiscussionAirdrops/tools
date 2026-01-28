/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Kita tidak perlu custom colors karena Slate, Indigo, dll 
      // sudah bawaan default Tailwind v3+
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Opsional: jika ingin font lebih rapi
      },
    },
  },
  plugins: [],
}