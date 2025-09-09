/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './widget-entry.ts',
    './components/widgets/**/*.{vue,js,ts}',
    './lib/widget-sdk/**/*.{js,ts}'
  ],
  theme: {
    extend: {},
  },
}