/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        darkBg: "#0B0C10",
        darkCard: "#1F2833",
        accentCyan: "#66FCF1",
        accentBlue: "#45A29E",
        lightText: "#C5C6C7",
      },
    },
  },
  plugins: [],
}
