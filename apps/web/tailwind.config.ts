import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#003593',
        'primary-container': '#0049C5',
        'primary-fixed': '#DBE1FF',
        'primary-fixed-dim': '#B4C5FF',
        secondary: '#4D5D8D',
        'secondary-fixed': '#DBE1FF',
        'secondary-container': '#B8C7FF',
        tertiary: '#721F00',
        'tertiary-fixed': '#FFDBD0',
        'tertiary-container': '#9A2D01',
        background: '#F8F9FF',
        surface: '#F8F9FF',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#F2F3F9',
        'surface-container': '#ECEEF3',
        'surface-container-high': '#E7E8EE',
        'surface-container-highest': '#E1E2E8',
        'surface-variant': '#E1E2E8',
        'surface-dim': '#D8DAE0',
        'on-background': '#191C20',
        'on-surface': '#191C20',
        'on-surface-variant': '#434654',
        'on-primary': '#FFFFFF',
        'on-primary-fixed': '#00174B',
        'on-primary-container': '#B6C6FF',
        outline: '#737685',
        'outline-variant': '#C3C6D6',
        error: '#BA1A1A',
        'error-container': '#FFDAD6',
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '2rem',
        xl: '3rem',
        full: '9999px',
      },
      fontFamily: {
        headline: ['var(--font-manrope)', 'Manrope', 'sans-serif'],
        display: ['var(--font-manrope)', 'Manrope', 'sans-serif'],
        body: ['var(--font-inter)', 'Inter', 'sans-serif'],
        label: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
