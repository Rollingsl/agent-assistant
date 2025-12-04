import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:     'var(--primary)',
        bg:          'var(--bg)',
        'bg-2':      'var(--bg-2)',
        panel:       'var(--panel)',
        'panel-2':   'var(--panel-2)',
        border:      'var(--border)',
        'text-main': 'var(--text-main)',
        'text-muted':'var(--text-muted)',
        accent:      'var(--accent)',
        success:     'var(--success)',
        warning:     'var(--warning)',
        error:       'var(--error)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in':     'fadeIn 0.4s ease',
        'fade-in-up':  'fadeInUp 0.4s ease',
        'pop-in':      'popIn 0.2s ease',
        'breathe':     'breathe 2.5s ease-in-out infinite',
        'pulse-ring':  'pulseRing 2.5s ease-in-out infinite',
        'glow-pulse':  'glowPulse 2s ease-in-out infinite',
        'shimmer':     'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};
export default config;
