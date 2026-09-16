import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-cairo)", "Cairo", "Tajawal", "system-ui", "sans-serif"],
        quran: ["var(--font-amiri)", "Amiri Quran", "Scheherazade New", "Traditional Arabic", "serif"],
      },
      colors: {
        night: { 950: "#050b0a", 900: "#0a1512", 800: "#102019", 700: "#173028" },
        gold: { 300: "#f5d78e", 400: "#e9c46a", 500: "#d4a94a", 600: "#b8892f" },
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(212,169,74,0.45)",
        panel: "0 20px 60px -20px rgba(0,0,0,0.7)",
      },
      keyframes: {
        shimmer: { "0%": { backgroundPosition: "200% 0" }, "100%": { backgroundPosition: "-200% 0" } },
        fadeUp: { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        shimmer: "shimmer 3s linear infinite",
        fadeUp: "fadeUp .35s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
