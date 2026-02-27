/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#FF4D00",
        "primary-glow": "rgba(255, 77, 0, 0.5)",
        "background-light": "#F3F4F6",
        "background-dark": "#0f1115",
        "surface-dark": "#16181D",
        "surface-darker": "#0A0B0E",
        "border-glow": "rgba(255, 77, 0, 0.3)",
        "card-light": "#FFFFFF",
        "card-dark": "#1A1D23",
        "dash-primary": "#FF6B00",
        "panel-dark": "#1E293B",
        "panel-border": "#2D3139",
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        body: ["Rajdhani", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        sans: ["Inter", "sans-serif"],
        "space-grotesk": ["Space Grotesk", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "12px",
        lg: "16px",
        xl: "24px",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(to right, #2a2a2a 1px, transparent 1px), linear-gradient(to bottom, #2a2a2a 1px, transparent 1px)",
        "obsidian-gradient":
          "radial-gradient(circle at center, #1a1c23 0%, #0f1115 100%)",
      },
      keyframes: {
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "spin-slow": "spin-slow 60s linear infinite",
        "spin-slow-reverse": "spin-slow 40s linear infinite reverse",
      },
    },
  },
  plugins: [],
};
