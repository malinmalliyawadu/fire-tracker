import { heroui } from "@heroui/theme";

/**
 * Design tokens live in `src/styles/globals.css` as CSS variables and are
 * exposed to utilities through `@theme inline` there. This file only exists
 * for the HeroUI plugin, which still needs the classic config format.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["selector", '[data-theme="dark"]'],
  plugins: [
    heroui({
      defaultTheme: "light",
      themes: {
        light: {
          colors: {
            background: "#EDEFE9",
            foreground: "#101712",
            focus: "#101712",
          },
        },
        dark: {
          colors: {
            background: "#0D110E",
            foreground: "#EEF0EA",
            focus: "#EEF0EA",
          },
        },
      },
    }),
  ],
};
