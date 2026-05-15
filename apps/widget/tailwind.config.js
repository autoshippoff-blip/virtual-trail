/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  prefix: 'tryon-',
  theme: {
    extend: {
      colors: {
        primary: 'var(--tryon-primary, #000000)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Avoid resetting global styles of the host page
  }
}
