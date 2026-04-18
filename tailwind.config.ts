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
        gtc: {
          green: "#4D5958",
          "green-dark": "#374241",
          red: "#BF1725",
          "red-dark": "#830B15",
          dark: "#181818",
        },
      },
    },
  },
  plugins: [],
};

export default config;
