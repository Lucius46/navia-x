import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        line: "var(--line)",
        panel: "var(--panel)",
        soft: "var(--soft)",
        brand: {
          DEFAULT: "var(--brand)",
          deep: "var(--brand-deep)",
          soft: "var(--brand-soft)"
        }
      },
      borderRadius: {
        xl2: "1.5rem"
      },
      boxShadow: {
        panel: "0 24px 80px rgba(15, 23, 42, 0.08)",
        float: "0 18px 48px rgba(30, 64, 175, 0.16)"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"]
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to right, rgba(15, 23, 42, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(15, 23, 42, 0.04) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;

