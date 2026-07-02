import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "#09090B", sidebar: "#0B0B0D", card: "#131316", card2: "#17171B",
        line: "rgba(255,255,255,.07)", line2: "rgba(255,255,255,.12)",
        pri: "#E7E7EA", sec: "#9A9AA2", mut: "#5E5E66",
        teal: "#2DD4BF", green: "#34D399",
      },
      fontFamily: { sans: ["var(--font-inter)", "system-ui", "sans-serif"], mono: ["var(--font-mono)", "monospace"] },
      borderRadius: { xl: "14px" },
    },
  },
  plugins: [],
} satisfies Config;
