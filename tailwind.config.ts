import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class', // Enable dark mode via class
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#a855f7', // Purple-500
          DEFAULT: '#8b5cf6', // Purple-600
          dark: '#7c3aed', // Purple-700
        },
        secondary: {
          light: '#ec4899', // Pink-500
          DEFAULT: '#db2777', // Pink-600
          dark: '#be185d', // Pink-700
        },
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
      },
    },
  },
  plugins: [],
};
