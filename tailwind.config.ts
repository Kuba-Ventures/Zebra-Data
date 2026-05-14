import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0A1628",
          2: "#16243C",
          3: "#1F2F4D",
        },
        mid: "#4A5872",
        muted: "#8995A8",
        line: {
          DEFAULT: "#E6E9EF",
          soft: "#F0F2F6",
        },
        surface: {
          DEFAULT: "#FAFAF7",
          2: "#F4F4F0",
        },
        card: "#FFFFFF",
        accent: {
          DEFAULT: "#1B5BFF",
          2: "#4F84FF",
          ink: "#0E3DCC",
          soft: "#EEF2FE",
        },
        coral: "#FF7A66",
        teal: "#11B5C3",
        good: "#18A974",
        warn: "#E0A800",
        danger: "#DC2F44",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter-tight)", "var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      borderRadius: {
        sm: "8px",
        DEFAULT: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "28px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(10,22,40,0.04), 0 1px 1px rgba(10,22,40,0.03)",
        DEFAULT: "0 4px 14px rgba(10,22,40,0.05), 0 2px 4px rgba(10,22,40,0.04)",
        lg: "0 24px 48px -16px rgba(10,22,40,0.18), 0 8px 20px -8px rgba(10,22,40,0.08)",
        accent: "0 12px 32px -8px rgba(27,91,255,0.35)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 600ms cubic-bezier(0.2,0.7,0.2,1) both",
        shimmer: "shimmer 1.8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
