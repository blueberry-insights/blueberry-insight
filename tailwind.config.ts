import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", ".dark"],
  content: [
    "./src/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background))",
        foreground: "rgb(var(--foreground))",
        card: "rgb(var(--card))",
        "card-foreground": "rgb(var(--card-foreground))",
        muted: "rgb(var(--muted))",
        border: "rgb(var(--border))",
        primary: {
          DEFAULT: "rgb(var(--primary))",
          600: "rgb(var(--primary-600))",
          foreground: "rgb(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary))",
          foreground: "rgb(var(--secondary-foreground))"
        },
        success: "rgb(var(--success))",
        warning: "rgb(var(--warning))",
        destructive: "rgb(var(--destructive))"
      },
      borderRadius: {
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-manrope)", "var(--font-inter)", "ui-sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
