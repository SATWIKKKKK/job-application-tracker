import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0049C5',
        background: '#F8F9FF',
        'on-surface': '#0B1C30',
        'surface-container': '#E5EEFF',
        'surface-container-low': '#EFF4FF',
        'outline-variant': '#C2C6D8',
        'on-surface-variant': '#424656',
        error: '#BA1A1A',
      },
      fontFamily: {
        headline: ['var(--font-manrope)', 'Manrope', 'sans-serif'],
        body: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
