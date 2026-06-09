import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Body: Barlow. Headings/labels: Barlow Condensed. Poster: Bebas Neue.
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        poster: ["var(--font-poster)", "var(--font-display)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          2: "hsl(var(--surface-2))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        // VOLT — primary athletic accent (high-energy lime)
        ember: {
          50: "#f9ffe5",
          100: "#efffb8",
          200: "#e2ff7a",
          300: "#d4ff3d",
          400: "#c6ff00",
          500: "#bfff00",
          600: "#9fd400",
          700: "#74a000",
          800: "#577800",
          900: "#3f5600",
          DEFAULT: "#bfff00",
        },
        // FLUX — electric cyan secondary
        current: {
          400: "#5cf0ff",
          500: "#00e5ff",
          600: "#00b8cc",
          DEFAULT: "#00e5ff",
        },
        gold: "#ffb020",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "ember-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(191,255,0,0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(191,255,0,0)" },
        },
        "colon-blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.25" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out",
        "ember-pulse": "ember-pulse 1.6s ease-in-out infinite",
        "colon-blink": "colon-blink 1s step-end infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
