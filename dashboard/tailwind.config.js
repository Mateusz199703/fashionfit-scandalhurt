/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#111111',
          50: '#F4F4F4',
          100: '#EAEAEA',
          600: '#111111',
          700: '#000000',
          800: '#000000',
        },
        secondary: {
          DEFAULT: '#6B6B6B',
          50: '#F6F6F6',
          100: '#ECECEC',
          600: '#6B6B6B',
          700: '#4F4F4F',
        },
        ink: {
          DEFAULT: '#111111',
          soft: '#595959',
          faint: '#8A8A8A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
