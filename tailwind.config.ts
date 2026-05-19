import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        green: 'var(--color-green)',
        rose: 'var(--color-rose)',
        orange: 'var(--color-orange)',
        gold: 'var(--color-gold)',
        text: 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
        border: 'var(--color-border)',
        white: 'var(--color-white)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
      borderRadius: {
        btn: 'var(--radius-btn)',
        card: 'var(--radius-card)',
        img: 'var(--radius-img)',
        input: 'var(--radius-input)',
      },
      maxWidth: {
        site: '1440px',
      },
      transitionTimingFunction: {
        possah: 'ease',
      },
      transitionDuration: {
        possah: '250ms',
      },
    },
  },
  plugins: [],
}

export default config
