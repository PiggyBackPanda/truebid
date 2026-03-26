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
        // Primary
        navy: "#0f1a2e",
        "navy-light": "#1a2a45",
        "navy-mid": "#243656",
        slate: "#334766",
        // Accent
        amber: "#e8a838",
        "amber-light": "#f5c563",
        "amber-glow": "rgba(232, 168, 56, 0.15)",
        // Semantic
        green: "#3db87a",
        "green-bg": "#e8f5e9",
        red: "#e05252",
        sky: "#4a90d9",
        // Neutrals
        bg: "#f7f5f0",
        "bg-card": "#ffffff",
        text: "#1a1a1a",
        "text-muted": "#6b7280",
        "text-light": "#9ca3af",
        border: "#e5e2db",
      },
      fontFamily: {
        serif: ["DM Serif Display", "Georgia", "serif"],
        sans: ["Outfit", "-apple-system", "sans-serif"],
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
          "0 1px 3px rgba(15, 26, 46, 0.06), 0 4px 12px rgba(15, 26, 46, 0.04)",
        lg: "0 4px 6px rgba(15, 26, 46, 0.04), 0 12px 32px rgba(15, 26, 46, 0.08)",
        amber: "0 4px 16px rgba(232, 168, 56, 0.3)",
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
          "0%": { backgroundColor: "rgba(232, 168, 56, 0.15)" },
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
