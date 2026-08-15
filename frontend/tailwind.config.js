/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Màu chính — Amber/Walnut tone phù hợp nội thất
        primary: {
          50:  '#fdf8f0',
          100: '#faefd9',
          200: '#f4dab2',
          300: '#ecc080',
          400: '#e39f4d',
          500: '#d4852a',   // Main brand color
          600: '#b86d1e',
          700: '#9a5518',
          800: '#7d441a',
          900: '#673919',
          950: '#391c09',
        },
        // Neutral tones — gỗ tối
        wood: {
          50:  '#faf7f4',
          100: '#f3ede5',
          200: '#e5d8c8',
          300: '#d4bca5',
          400: '#be9a7d',
          500: '#a87d5e',
          600: '#8f6449',
          700: '#774f3b',
          800: '#624134',
          900: '#51372d',
          950: '#2c1b16',
        },
        // Background tối cho dark sections
        surface: {
          DEFAULT: '#1a1a1a',
          card:    '#242424',
          hover:   '#2e2e2e',
        },
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        admin: ['"Be Vietnam Pro"', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'card': '0 4px 24px -4px rgba(0,0,0,0.06)',
        'card-hover': '0 16px 40px -8px rgba(0,0,0,0.12)',
        'glass': '0 8px 32px 0 rgba(28, 25, 23, 0.08)',
        'luxury': '0 20px 40px -15px rgba(161, 98, 7, 0.15)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
