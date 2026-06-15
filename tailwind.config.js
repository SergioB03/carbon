/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // CarbonBridge palette — deep slate + signal greens/ambers
        ink: '#0b1220',
        panel: '#121a2b',
        panel2: '#1a2438',
        edge: '#243049',
        mute: '#7d8aa5',
        text: '#e6ecf7',
        brand: '#34d399',     // verified / good
        brandDim: '#10b981',
        warn: '#f59e0b',      // verification-priority amber
        danger: '#f87171',    // high divergence
        accent: '#60a5fa',    // network / info
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}
