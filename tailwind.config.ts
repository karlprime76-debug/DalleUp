import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        dalle: {
          orange: "#ff6b1a",
          charcoal: "#171717",
          lime: "#b8ff2c",
          cream: "#fff7ed"
        }
      },
      boxShadow: {
        glow: "0 20px 60px rgba(255, 107, 26, 0.25)"
      }
    }
  },
  plugins: []
};

export default config;
