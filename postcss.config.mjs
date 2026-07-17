// Tailwind only emits styles into files that `@import "tailwindcss"`, so this
// global PostCSS pass leaves the Payload admin SCSS and (frontend) CSS untouched.
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
