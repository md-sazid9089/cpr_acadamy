/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // White + green brand palette. `brand` is the primary green ramp.
        brand: {
          50: '#eefbf3',
          100: '#d6f5e2',
          200: '#b0eac9',
          300: '#7cd9a8',
          400: '#45c082',
          500: '#1fa463',
          600: '#12854f',
          700: '#106a42',
          800: '#105437',
          900: '#0e452f',
          950: '#04271a',
        },
        surface: {
          light: '#ffffff',
          subtle: '#f6f8f7',
          dark: '#0d1512',
          'dark-subtle': '#141f1a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
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
