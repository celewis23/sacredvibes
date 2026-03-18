import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Sacred Vibes Yoga (warm earthy palette)
        yoga: {
          50:  '#faf7f4',
          100: '#f3ece4',
          200: '#e8d9c9',
          300: '#d9c0a4',
          400: '#c4a27e',
          500: '#b08860',
          600: '#9a7150',
          700: '#7b5a42',
          800: '#654b39',
          900: '#523d31',
        },
        // Sacred Hands (deep warm neutrals)
        hands: {
          50:  '#fbf8f5',
          100: '#f5ede4',
          200: '#ead9c8',
          300: '#d9bda3',
          400: '#c49b7a',
          500: '#b08060',
          600: '#9a6950',
          700: '#7e5542',
          800: '#674638',
          900: '#55392d',
        },
        // Sacred Sound (soft violet/indigo)
        sound: {
          50:  '#f6f5fb',
          100: '#eeecf7',
          200: '#dddaf0',
          300: '#c4bfe5',
          400: '#a89cd5',
          500: '#8e7ac3',
          600: '#7a60b3',
          700: '#634f96',
          800: '#52427b',
          900: '#453866',
        },
        // Shared neutrals
        sacred: {
          50:  '#faf9f7',
          100: '#f3f0eb',
          200: '#e8e2d9',
          300: '#d5ccbe',
          400: '#bcaf9d',
          500: '#a49280',
          600: '#8c7a68',
          700: '#736456',
          800: '#5f5248',
          900: '#4e443d',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'Cormorant Garamond', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'Lato', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'Lato', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-2xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-xl':  ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg':  ['3rem',    { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'display-md':  ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-sm':  ['1.875rem', { lineHeight: '1.25' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      borderRadius: {
        'xl':  '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft':  '0 2px 20px -4px rgba(0,0,0,0.08), 0 4px 8px -4px rgba(0,0,0,0.04)',
        'glow':  '0 0 40px -8px rgba(123, 110, 93, 0.25)',
        'card':  '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px -4px rgba(0,0,0,0.08)',
      },
      animation: {
        'fade-in':    'fadeIn 0.5s ease-out',
        'slide-up':   'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },               to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      backgroundImage: {
        'texture-grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}

export default config
