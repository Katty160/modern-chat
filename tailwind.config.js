/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  presets: [require("nativewind/preset")],

  theme: {
    extend: {
      colors: {
        primary: "#E8A1B8",
        primaryDark: "#C97F99",

        secondary: "#151519",

        background: "#0B0B0F",
        surface: "#0B0B0F",
        surfaceLight: "#1C1C22",

        textMuted: "#777780",

        danger: "#EF6B73",
      },
    },
  },

  plugins: [],
};

