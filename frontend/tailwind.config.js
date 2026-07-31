/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Aapke custom colors jo HTML script me the
        gemini: {
          bg: '#131314',        /* Main Deep Background */
          surface: '#1e1f20',   /* Card/Modal Surface */
          hover: '#2d2e2f',     /* Hover State */
          border: '#444746',    /* Subtle Borders */
          text: '#e3e3e3',      /* Primary Text */
          blue: '#4c8df6'       /* Gemini Blue */
        }
      }
    },
  },
  plugins: [],
}