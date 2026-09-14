const token = (name) => `color-mix(in srgb, var(--color-${name}) calc(<alpha-value> * 100%), transparent)`;
const scale = (name) => Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(shade => [shade, token(`${name}-${shade}`)]),
);

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    colors: {
      inherit: 'inherit', current: 'currentColor', transparent: 'transparent',
      white: token('white'), black: token('dark'),
      brand: scale('brand'), blue: scale('brand'),
      accent: scale('accent'), red: scale('accent'),
      stone: scale('stone'),
      surface: {
        light: token('page'), subtle: token('section'),
        dark: token('dark'), 'dark-subtle': token('dark-panel'),
      },
    },
    extend: {
      borderRadius: {
        lg: 'var(--radius-control)',
        xl: 'var(--radius-card)',
        '2xl': 'var(--radius-card)',
        full: 'var(--radius-pill)',
        control: 'var(--radius-control)',
        card: 'var(--radius-card)',
        image: 'var(--radius-image)',
      },
      borderWidth: { DEFAULT: '1px', 2: '1px', 4: '1px', 8: '1px' },
      boxShadow: Object.fromEntries(
        ['sm', 'DEFAULT', 'md', 'lg', 'xl', '2xl', 'inner'].map(size => [size, 'none']),
      ),
      dropShadow: Object.fromEntries(['sm', 'DEFAULT', 'md', 'lg', 'xl', '2xl'].map(size => [size, '0 0 transparent'])),
      borderColor: { DEFAULT: token('border') },
      textColor: { red: { 500: token('red-deep') }, accent: { 500: token('red-deep') } },
      letterSpacing: { tighter: '0', tight: '0', normal: '0', wide: '0', wider: '0', widest: '0' },
      fontFamily: {
        sans: ['var(--font-body)'],
        bn: ['var(--font-body)'],
        heading: ['var(--font-heading)'],
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Course-player bottom sheet. Paired with motion-reduce:animate-none so
        // it becomes an instant show when the visitor asks for less motion.
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        marquee: 'marquee 28s linear infinite',
        'fade-in': 'fade-in 0.25s ease-out both',
        'slide-up': 'slide-up 0.2s ease-out both',
      },
    },
  },
  plugins: [],
};
