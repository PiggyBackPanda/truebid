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
        // Brand core
        navy: "#0f1623",
        "navy-light": "#1b2640",
        "navy-mid": "#243456",
        surface: "#1a2b40",
        slate: "#334766",
        // Amber — single primary accent
        amber: {
          DEFAULT: "#f59e0b",
          light: "#fbbf24",
          dark: "#b45309",
          glow: "rgba(245, 158, 11, 0.15)",
        },
        // Semantic
        green: "#10b981",
        "green-bg": "#d1fae5",
        red: "#ef4444",
        // Neutrals
        bg: "#f7f5f0",
        "bg-card": "#ffffff",
        text: "#1a1a1a",
        "text-muted": "#6b7280",
        "text-light": "#9ca3af",
        border: "#e5e2db",
      },
      fontFamily: {
        serif: ["Georgia", "Times New Roman", "serif"],
        sans: [
          "var(--font-outfit)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        heading: ["Georgia", "Times New Roman", "serif"],
      },
      fontSize: {
        hero: ["56px", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
        h1: ["32px", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        h2: ["28px", { lineHeight: "1.3", letterSpacing: "-0.02em" }],
        h3: ["20px", { lineHeight: "1.4", letterSpacing: "-0.01em" }],
        h4: ["18px", { lineHeight: "1.4" }],
        body: ["14px", { lineHeight: "1.6" }],
        "body-lg": ["16px", { lineHeight: "1.6" }],
        small: ["13px", { lineHeight: "1.5" }],
        xs: ["12px", { lineHeight: "1.4" }],
        caption: ["11px", { lineHeight: "1.3", letterSpacing: "0.05em" }],
        overline: ["11px", { lineHeight: "1.3", letterSpacing: "0.1em" }],
      },
      borderRadius: {
        sm: "8px",
        DEFAULT: "12px",
        lg: "16px",
        full: "9999px",
      },
      boxShadow: {
        DEFAULT:
          "0 1px 3px rgba(15, 22, 35, 0.06), 0 4px 12px rgba(15, 22, 35, 0.04)",
        lg: "0 4px 6px rgba(15, 22, 35, 0.04), 0 12px 32px rgba(15, 22, 35, 0.08)",
        amber: "0 4px 16px rgba(245, 158, 11, 0.35)",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        highlightNew: {
          "0%": { backgroundColor: "rgba(245, 158, 11, 0.15)" },
          "100%": { backgroundColor: "transparent" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out both",
        "pulse-dot": "pulseDot 2s infinite",
        "highlight-new": "highlightNew 1.5s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
