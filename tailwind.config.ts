import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        'primary-color': 'var(--primary-color)',
        'off-white': 'var(--off-white)',
        'text-dark': 'var(--text-dark)',
        'text-light': 'var(--text-light)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
      },
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
        heading: ['Nunito', 'sans-serif'],
        body: ['Nunito', 'sans-serif'],
      },
      transitionDuration: {
        300: 'var(--animation-speed)',
      },
    },
  },
  plugins: [],
} satisfies Config;
