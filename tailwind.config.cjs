module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // LIGHT MODE COLORS
        paper: "#F3ECDC",
        chalk: "#E7E1D3",
        ink: "#2D2A26",
        pthalo: "#0F3B2E",
        fern: "#4F7F67",
        oak: "#4A3728",
        brass: "#B0893C",

        // DARK MODE COLORS
        night: "#0D1816",
        cellar: "#16221F",
        parchment: "#D6CEBF",
        bone: "#E7E7E7",
      },
    },
  },
  plugins: [],
};


