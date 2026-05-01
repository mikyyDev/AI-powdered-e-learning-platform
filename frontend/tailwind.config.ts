import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#04040d",
          800: "#080818",
          700: "#0d0d22",
          600: "#12122e",
          500: "#1a1a3e",
          400: "#252550",
        },
        brand: {
          50: "#f0edff",
          100: "#e0d9ff",
          200: "#c2b3ff",
          300: "#a38dff",
          400: "#8566ff",
          500: "#6741ff",
          600: "#5533cc",
          700: "#402699",
          800: "#2b1a66",
          900: "#150d33",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-glow":
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(103,65,255,0.35) 0%, transparent 70%)",
        "card-glow":
          "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(103,65,255,0.12) 0%, transparent 80%)",
      },
      boxShadow: {
        glow: "0 0 30px rgba(103,65,255,0.25)",
        "glow-sm": "0 0 12px rgba(103,65,255,0.2)",
        glass: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
