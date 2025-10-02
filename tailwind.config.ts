import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Kanva Brand Colors
        kanva: {
          green: '#93D500',      // Primary bright green
          darkGreen: '#17351A',  // Dark green accent
          lightGreen: '#E8F5CC', // Light green background
          sage: '#7BA05B',       // Medium green
          forest: '#2D5A3D',     // Forest green
        },
        // UI Colors
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        // Status Colors
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      boxShadow: {
        'kanva': '0 4px 6px -1px rgba(147, 213, 0, 0.1), 0 2px 4px -1px rgba(147, 213, 0, 0.06)',
        'kanva-lg': '0 10px 15px -3px rgba(147, 213, 0, 0.1), 0 4px 6px -2px rgba(147, 213, 0, 0.05)',
      },
    },
  },
  plugins: [],
}

export default config