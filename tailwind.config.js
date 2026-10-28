/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nexus: {
          bg: '#0D1117',
          card: '#161B22',
          elevated: '#1F242D',
          border: '#30363D',
          red: '#EA1D2C',
          redHover: '#FF2E3D',
          blue: '#58A6FF',
          blueDim: '#1F6FEB',
          green: '#3FB950',
          amber: '#D29922',
          purple: '#BC8CFF',
          text: '#E6EDF3',
          muted: '#8B949E',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
