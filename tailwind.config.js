/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "#0b1220",
        surface: "#131c2e",
        accent: "#3b82f6",
        band: {
          red: "#ef4444",
          yellow: "#eab308",
          green: "#22c55e"
        }
      }
    }
  },
  plugins: []
};
