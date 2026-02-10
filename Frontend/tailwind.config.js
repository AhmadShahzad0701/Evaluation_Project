/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",        // Blue-600
        "primary-foreground": "#ffffff",
        muted: "#f1f5f9",          // slate-100
        "muted-foreground": "#64748b", // slate-500
        border: "#e5e7eb",          // gray-200
        background: "#ffffff",
      },
    },
  },
  plugins: [],
};
