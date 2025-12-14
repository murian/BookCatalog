import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          start: '#667EEA',
          end: '#764BA2',
          DEFAULT: '#667EEA',
        },
        secondary: '#43CBFF',
        success: '#2ECC71',
        warning: '#F39C12',
        error: '#E74C3C',
        background: '#F8F9FA',
        'text-primary': '#2C3E50',
        'text-secondary': '#7F8C8D',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #43CBFF 0%, #9708CC 100%)',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        button: '12px',
        card: '16px',
        large: '30px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.1)',
        button: '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};

export default config;
