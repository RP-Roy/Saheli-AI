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
        // Primary Brand (Warm Strawberry Rose / Soft Pink)
        primary: {
          50:  '#FFF5F7',
          100: '#FCE4EC',
          200: '#F8BBD0',
          300: '#F48FB1',
          400: '#F06292',
          500: '#E85D75', // Primary Accent
          600: '#D6455D',
          700: '#BE3048',
          800: '#8E1E32',
          900: '#5C1220',
          950: '#3B0B14',
        },
        accent: {
          50:  '#FFF0F3',
          100: '#FFE3E8',
          200: '#FFCCD5',
          300: '#FFA0AF',
          400: '#FB7185',
          500: '#E85D75',
          600: '#D6455D',
          700: '#BE123C',
        },
        blush: {
          50:  '#FFFFFF',
          100: '#FFF9FA',
          200: '#FFF5F7', // Primary Background
          300: '#FCEBF0',
          400: '#FCE4EC', // Secondary Soft Pink
          500: '#F8BBD0',
          600: '#F48FB1',
        },
        // Surfaces & Text (Light environment with rich plum-charcoal text)
        surface: {
          50:  '#FFFFFF',
          100: '#FFFDFE',
          200: '#FFF5F7',
          300: '#FCE8EE',
          400: '#F8D7E0',
          500: '#E5C2CC',
          600: '#A8929A',
          700: '#806B73', // Secondary text
          800: '#5C454D',
          900: '#3B2930', // Dark Primary text
        },
        // Status & Safety Indicators
        safe: {
          50:  '#ECFDF5',
          100: '#D1FAE5',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        caution: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        danger: {
          50:  '#FFF1F2',
          100: '#FFE4E6',
          400: '#FB7185',
          500: '#E85D75',
          600: '#E11D48',
          700: '#BE123C',
          800: '#9F1239',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.75) 100%)',
        'subtle-rose': 'linear-gradient(135deg, #FFF5F7 0%, #FCE4EC 100%)',
        'hero-glow': 'radial-gradient(ellipse at top right, rgba(248, 187, 208, 0.45) 0%, rgba(255, 245, 247, 0) 70%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-gentle': 'pulseGentle 2.5s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 2.5s ease-in-out infinite',
        'glow-primary': 'glowPrimary 2.5s ease-in-out infinite',
        'glow-safe': 'glowSafe 2s ease-in-out infinite',
        'glow-danger': 'glowDanger 1.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        pulseGentle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.04)' },
        },
        glowPrimary: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(232, 93, 117, 0.25)' },
          '50%': { boxShadow: '0 0 28px rgba(232, 93, 117, 0.45)' },
        },
        glowSafe: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(16, 185, 129, 0.25)' },
          '50%': { boxShadow: '0 0 22px rgba(16, 185, 129, 0.45)' },
        },
        glowDanger: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(232, 93, 117, 0.35)' },
          '50%': { boxShadow: '0 0 30px rgba(232, 93, 117, 0.65)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        }
      },
      boxShadow: {
        'glass': '0 8px 30px -4px rgba(232, 93, 117, 0.08), 0 2px 10px -2px rgba(59, 41, 48, 0.03)',
        'glass-sm': '0 4px 16px -2px rgba(232, 93, 117, 0.06), 0 1px 4px rgba(59, 41, 48, 0.02)',
        'card': '0 10px 30px -5px rgba(232, 93, 117, 0.07), 0 2px 8px -2px rgba(59, 41, 48, 0.04)',
        'card-hover': '0 18px 38px -6px rgba(232, 93, 117, 0.14), 0 4px 14px -2px rgba(59, 41, 48, 0.06)',
        'soft-pink': '0 8px 24px -4px rgba(232, 93, 117, 0.18)',
        'glow-primary': '0 0 24px rgba(232, 93, 117, 0.35)',
        'glow-safe': '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-danger': '0 0 24px rgba(232, 93, 117, 0.45)',
        'inner-light': 'inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
