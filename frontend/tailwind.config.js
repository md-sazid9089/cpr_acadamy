/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // White + green brand palette. `brand` is the primary green ramp.
        // Royal emerald — deep, jewel-toned, slightly teal-leaning for a
        // premium feel. Replaces the earlier bright/leafy emerald.
        brand: {
          50: '#eef6f2',
          100: '#d5ebe0',
          200: '#a8d5be',
          300: '#6fb89a',
          400: '#3d9976',
          500: '#217a5a',
          600: '#186347',
          700: '#14513b',
          800: '#114231',
          900: '#0e3628',
          950: '#071e16',
        },
        // Warm accent, paired with `brand` for promo emphasis: offer prices,
        // urgency notes and the Registration action. Global on purpose — use
        // `accent-*` rather than raw amber classes so the promo colour can be
        // retuned in one place.
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        surface: {
          light: '#ffffff',
          subtle: '#f6f8f7',
          dark: '#0d1512',
          'dark-subtle': '#141f1a',
        },
      },
      fontFamily: {
        // 'Noto Sans Bengali' sits after the Latin faces on purpose: the
        // browser picks per glyph, so Latin keeps the existing look and only
        // Bengali characters — which none of the earlier fonts cover — fall
        // through to it.
        sans: ['Inter', 'Segoe UI', 'system-ui', 'Noto Sans Bengali', 'sans-serif'],
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
      },
      animation: {
        marquee: 'marquee 28s linear infinite',
        'fade-in': 'fade-in 0.25s ease-out both',
      },
    },
  },
  plugins: [],
};
