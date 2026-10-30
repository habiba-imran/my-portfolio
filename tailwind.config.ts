import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--page)",
        foreground: "var(--ink)",
        accent: "var(--accent)",
        muted: "var(--muted)",
        card: "var(--surface)",
        border: "var(--line)",
      },
      fontFamily: {
        display: ["var(--font-onest)", "sans-serif"],
        body: ["var(--font-onest)", "sans-serif"],
      },
      fontSize: {
        "display-xl": [
          "clamp(2.7rem, 6.4vw, 5rem)",
          { lineHeight: "0.98", letterSpacing: "0" },
        ],
        "display-lg": [
          "clamp(2rem, 4vw, 3.25rem)",
          { lineHeight: "1.05", letterSpacing: "0" },
        ],
        "display-md": [
          "clamp(1.5rem, 3vw, 2.25rem)",
          { lineHeight: "1.2", letterSpacing: "0" },
        ],
        "display-sm": [
          "clamp(1.25rem, 2vw, 1.5rem)",
          { lineHeight: "1.3", letterSpacing: "0" },
        ],
      },
      spacing: {
        section: "clamp(5rem, 15vh, 10rem)",
        "section-sm": "clamp(3rem, 10vh, 6rem)",
      },
    },
  },
  plugins: [],
};

export default config;
