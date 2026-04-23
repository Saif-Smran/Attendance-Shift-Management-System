/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f6f8f0",
          100: "#e9eedb",
          200: "#d4dfb7",
          300: "#b7c985",
          400: "#98b255",
          500: "#789635",
          600: "#5f7828",
          700: "#4a5f21",
          800: "#3d4d1e",
          900: "#35421d"
        },
        accent: {
          500: "#c96e2c",
          600: "#a95b25"
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0, 0, 0, 0.08)"
      }
    }
  },
  plugins: []
};
