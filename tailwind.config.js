/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-archivo)', 'system-ui', 'sans-serif'],
        label: ['var(--font-plex-mono)', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
      },
      colors: {
        // Marketing palette (homepage): warm near-black + cream, NexBotix green accent
        nb: {
          bg: '#0b0b0c',
          surface: '#141416',
          dim: '#17171a',
          line: '#1f1f22',
          line2: '#2a2a2e',
          fg: '#f2eee6',
          muted: '#a39e95',
          muted2: '#7d7972',
          acc: '#22c55e',
          'acc-hover': '#16a34a',
          'on-acc': '#0b0b0c',
        },
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
    },
  },
  plugins: [],
}

