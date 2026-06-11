import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#10182D",
        muted: "#697083",
        lavender: "#2468C9",
        lilac: "#EEF5FF",
        stone: "#F7F8F4",
        mint: "#ECFDF5",
        safe: "#059669",
        apricot: "#FFFBEB",
        medium: "#D97706",
        rose: "#FEF2F2",
        high: "#DC2626",
      },
      boxShadow: {
        soft: "0 8px 24px rgba(15, 23, 41, 0.06)",
      },
    },
  },
  plugins: [],
} satisfies Config;
