import type { Config } from 'tailwindcss'

const config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      maxWidth: {
        shell: '1800px',
      },
    },
  },
  plugins: [],
} satisfies Config

export default config
