/** @type {import('tailwindcss').Config} */
export default {
  // include index.html and jsx/tsx files so Tailwind can find classes in React components
  content: ["./index.html", "./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
}