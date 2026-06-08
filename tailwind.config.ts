import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef9ff",
          100: "#d9f0ff",
          200: "#bce4ff",
          300: "#8ed3ff",
          400: "#59b8ff",
          500: "#3296ff",
          600: "#1b75f5",
          700: "#145de1",
          800: "#174db6",
          900: "#19438f",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
