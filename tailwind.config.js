import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./support-dev.html",
    "./js/**/*.js",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cosmos: {
          50:  '#f4f0ff',
          100: '#e9e2ff',
          200: '#d4c7ff',
          300: '#b8a3ff',
          400: '#9a7aff',
          500: '#7b4dff',
          600: '#6633e6',
          700: '#5326bf',
          800: '#3e1a8c',
          900: '#2a0e5e',
        },
        nebula: {
          pink:   '#f472b6',
          violet: '#a78bfa',
          cyan:   '#67e8f9',
          amber:  '#fbbf24',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body:    ['"Inter"', 'system-ui', 'sans-serif'],
      },
      screens: {
        'xs': '480px',
      },
      animation: {
        'float':        'float 6s ease-in-out infinite',
        'pulse-glow':   'pulseGlow 2s ease-in-out infinite',
        'twinkle':      'twinkle 3s ease-in-out infinite',
        'heart-beat':   'heartBeat 1.5s ease-in-out infinite',
        'badge-pulse':  'badgePulse 2s ease-in-out infinite',
        'slide-up':     'slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-in':      'fadeIn 0.4s ease-out',
        'spin-slow':    'spin 12s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', boxShadow: '0 0 20px rgba(154, 122, 255, 0.3)' },
          '50%':      { opacity: '1',   boxShadow: '0 0 40px rgba(154, 122, 255, 0.7)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%':      { opacity: '1',   transform: 'scale(1.2)' },
        },
        heartBeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '14%':      { transform: 'scale(1.15)' },
          '28%':      { transform: 'scale(1)' },
          '42%':      { transform: 'scale(1.1)' },
          '70%':      { transform: 'scale(1)' },
        },
        badgePulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%':      { transform: 'scale(1.1)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config