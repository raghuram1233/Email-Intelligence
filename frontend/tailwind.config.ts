import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        elevated: "var(--elevated)",
        border: "var(--border)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "#ffffff",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 24px -4px rgba(0,0,0,0.35)",
        glow: "0 0 0 1px rgba(99,102,241,0.35), 0 8px 32px -8px rgba(99,102,241,0.35)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
