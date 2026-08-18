/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Client brand palette, taken from the CPR logo and poster artwork:
        // navy dominant, red as the sparing action colour, white the ground.
        //
        // `brand` keeps its name so the ~115 existing usages remap by hue
        // alone — shade and opacity logic across the app is unchanged.
        // Anchor: 600 = #1B3F8B, the blue of the logo wordmark and the poster
        // header bands. Verified AA: white on 600 = 9.86:1, 600 on white = 9.86:1,
        // 400 on surface-dark = 5.55:1.
        brand: {
          50: '#f6f7fa',
          100: '#e8ecf3',
          200: '#cdd5e5',
          300: '#a8b6d3',
          400: '#768cb9',
          500: '#4965a2',
          600: '#1b3f8b',
          700: '#163472',
          800: '#122a5c',
          900: '#0e2046',
          950: '#09152f',
        },
        // Action red — the "P" in the logo, the ECG trace, urgency badges.
        // Used sparingly, as in the posters: CTAs, alerts, offer emphasis.
        // Anchor: 600 = #E31E24. Verified AA: white on 600 = 4.69:1 and
        // 600 on white = 4.69:1 — both clear 4.5 but with little headroom, so
        // prefer 700 (6.47:1) for small text on white.
        accent: {
          50: '#fef6f6',
          100: '#fce9e9',
          200: '#f9cecf',
          300: '#f4aaac',
          400: '#ee787c',
          500: '#e94b50',
          600: '#e31e24',
          700: '#ba191e',
          800: '#961418',
          900: '#720f12',
          950: '#4d0a0c',
        },
        // Neutrals retuned off the green tint they carried to match the navy.
        surface: {
          light: '#ffffff',
          subtle: '#f6f7fb',
          dark: '#0b1220',
          'dark-subtle': '#131c2e',
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
