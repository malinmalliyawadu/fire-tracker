import { heroui } from "@heroui/theme";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      colors: {
        ink: {
          50: "#f5f6fa",
          100: "#e4e6ee",
          200: "#c1c5d3",
          300: "#9ba1b5",
          400: "#6e7591",
          500: "#4f546b",
          600: "#363a4d",
          700: "#1f2233",
          800: "#13151f",
          900: "#0a0b13",
          950: "#050508",
        },
        accent: {
          DEFAULT: "#7c83e7",
          soft: "#5e6ad2",
          deep: "#4651b8",
          glow: "rgba(124, 131, 231, 0.35)",
        },
        gain: "#22c55e",
        loss: "#ef4444",
      },
      boxShadow: {
        glow: "0 0 32px rgba(124, 131, 231, 0.25)",
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.4)",
      },
      borderRadius: {
        xl2: "20px",
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        dark: {
          colors: {
            background: "#050508",
            foreground: "#f5f6fa",
            primary: {
              DEFAULT: "#7c83e7",
              foreground: "#ffffff",
            },
            focus: "#7c83e7",
            danger: { DEFAULT: "#ef4444", foreground: "#ffffff" },
            success: { DEFAULT: "#22c55e", foreground: "#ffffff" },
          },
        },
      },
    }),
  ],
};
