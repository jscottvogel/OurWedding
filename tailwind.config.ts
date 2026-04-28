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
        sage: "var(--sage)",
        "dark-sage": "var(--dark-sage)",
        "light-sage": "var(--light-sage)",
        terra: "var(--terra)",
        "dark-terra": "var(--dark-terra)",
        "light-terra": "var(--light-terra)",
        ivory: "var(--ivory)",
        gold: "var(--gold)",
        charcoal: "var(--charcoal)",
        "mid-gray": "var(--mid-gray)",
        "light-gray": "var(--light-gray)",
      },
      fontFamily: {
        display: ["var(--font-playfair-display)", "serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
