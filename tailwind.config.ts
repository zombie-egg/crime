import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        noir: {
          night: "#1a1f3a",
          neon: "#FFD93D",
          slate: "#2d3748",
          fog: "#94a3b8",
          cyan: "#4fd1c5",
          danger: "#fb7185",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        neon: "0 0 0 1px rgba(255, 217, 61, 0.45), 0 0 26px rgba(255, 217, 61, 0.22)",
        cyan: "0 0 0 1px rgba(79, 209, 197, 0.35), 0 0 22px rgba(79, 209, 197, 0.18)",
      },
      keyframes: {
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "neon-pulse": {
          "0%, 100%": { opacity: "0.72", boxShadow: "0 0 16px rgba(255,217,61,.2)" },
          "50%": { opacity: "1", boxShadow: "0 0 30px rgba(255,217,61,.46)" },
        },
        "ripple": {
          "0%": { transform: "scale(0.1)", opacity: "0.75" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
      },
      animation: {
        "scan-line": "scan-line 3.2s linear infinite",
        "neon-pulse": "neon-pulse 1.8s ease-in-out infinite",
        ripple: "ripple 760ms ease-out forwards",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [animatePlugin],
} satisfies Config;
