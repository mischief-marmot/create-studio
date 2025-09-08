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
  plugins: [],
  // Force generation of specific classes we need
  safelist: [
    'btn',
    'btn-primary',
    'btn-sm',
    'bg-green-100',
    'bg-green-600',
    'create-studio-interactive-btn',
    'create-studio-modal-overlay',
    'create-studio-modal-close',
    'create-studio-modal-iframe'
  ]
}