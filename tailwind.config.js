/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}", // 🎯 CRÍTICO: Garante que as cores de lib/times.ts nunca sumam!
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};