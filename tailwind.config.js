// tailwind.config.js
const colors = require('tailwindcss/colors')
const isProduction = !process.env.ROLLUP_WATCH; // or some other env var like NODE_ENV
module.exports = {
  theme: {
    colors
  },
  purge: {
    content: [
      "./src/**/*.svelte",
      // may also want to include HTML files
      // "./src/**/*.html"
    ],
    // this is for extracting Svelte `class:` syntax but is not perfect yet, see below
    defaultExtractor: content => {
      const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || []
      const broadMatchesWithoutTrailingSlash = broadMatches.map(match => _.trimEnd(match, '\\'))
      const matches = broadMatches
        .concat(broadMatchesWithoutTrailingSlash)
      return matches
    },
    enabled: isProduction // disable purge in dev
  },
  darkMode: false
};
