/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#e8f5ed',
          100: '#c6e7d2',
          200: '#a0d8b4',
          300: '#79c996',
          400: '#5cbd80',
          500: '#3fb06a',
          600: '#2d9d56',
          700: '#1e8742',
          800: '#0F5132',
          900: '#063d22',
          950: '#022914',
        },
        dark: {
          50: '#f5f5f5',
          100: '#e0e0e0',
          200: '#bdbdbd',
          300: '#9e9e9e',
          400: '#757575',
          500: '#616161',
          600: '#424242',
          700: '#1a1a2e',
          800: '#12121f',
          900: '#0a0a14',
          950: '#06060c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(15, 81, 50, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(15, 81, 50, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
}
