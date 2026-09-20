import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.5rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        // Luxury Primary - Gold
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: '#fef9e7',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#d4af37',
          600: '#c9a227',
          700: '#b38f1f',
          800: '#927617',
          900: '#786018',
          950: '#453810',
        },

        // Luxury Secondary - Charcoal
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          50: '#f5f5f5',
          100: '#e5e5e5',
          200: '#d4d4d4',
          300: '#a3a3a3',
          400: '#737373',
          500: '#525252',
          600: '#404040',
          700: '#262626',
          800: '#171717',
          900: '#0a0a0a',
          950: '#050505',
        },

        // Luxury Accent - Gold
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },

        // Rich Blacks
        black: {
          DEFAULT: '#0a0a0a',
          light: '#1a1a1a',
          lighter: '#2d2d2d',
          dark: '#050505',
        },

        // Elegant Gold
        gold: {
          DEFAULT: '#d4af37',
          light: '#f4c542',
          lighter: '#f7d968',
          dark: '#c9a227',
          darker: '#b38f1f',
        },

        // Deep Charcoals
        charcoal: {
          DEFAULT: '#2d2d2d',
          light: '#3d3d3d',
          lighter: '#4a4a4a',
          dark: '#1a1a1a',
          darker: '#0a0a0a',
        },

        // Warm Whites
        'warm-white': {
          DEFAULT: '#f5f5f5',
          light: '#fafafa',
          dark: '#e5e5e5',
        },

        'warm-white-dark': {
          DEFAULT: '#a0a0a0',
          light: '#b0b0b0',
          dark: '#808080',
        },

        'charcoal-dark': {
          DEFAULT: '#1a1a1a',
          light: '#2a2a2a',
          dark: '#0a0a0a',
        },

        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },

        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },

        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },

        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },

        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },

        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },

        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },

      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'lg-sm': 'var(--radius-sm)',
        'lg-lg': 'var(--radius-lg)',
        'lg-xl': 'var(--radius-xl)',
        'lg-2xl': 'var(--radius-2xl)',
      },

      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        'premium': 'var(--shadow-premium)',
        'premium-lg': 'var(--shadow-premium-lg)',
        'gold': 'var(--shadow-gold)',
        'gold-lg': 'var(--shadow-gold-lg)',
        'luxury': 'var(--shadow-luxury)',
        'luxury-lg': 'var(--shadow-luxury-lg)',
        'glow-gold': '0 0 20px rgba(212, 175, 55, 0.3)',
        'glow-gold-lg': '0 0 40px rgba(212, 175, 55, 0.5)',
        'glow-gold-xl': '0 0 60px rgba(212, 175, 55, 0.6)',
      },

      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in-luxury': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-in-up-luxury': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in-luxury': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right-luxury': {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left-luxury': {
          from: { opacity: '0', transform: 'translateX(-24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'float-luxury': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-soft-luxury': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        'shimmer-gold': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'gold-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 12px rgba(212, 175, 55, 0.3)'
          },
          '50%': {
            boxShadow: '0 0 24px rgba(212, 175, 55, 0.5)'
          },
        },
        'particles-float': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '100% 100%' },
        },
      },

      animation: {
        'accordion-down': 'accordion-down 0.3s ease-out',
        'accordion-up': 'accordion-up 0.3s ease-out',
        'fade-in-luxury': 'fade-in-luxury 0.6s ease-out forwards',
        'fade-in-up-luxury': 'fade-in-up-luxury 0.7s ease-out forwards',
        'scale-in-luxury': 'scale-in-luxury 0.4s ease-out forwards',
        'slide-in-right-luxury': 'slide-in-right-luxury 0.5s ease-out forwards',
        'slide-in-left-luxury': 'slide-in-left-luxury 0.5s ease-out forwards',
        'float-luxury': 'float-luxury 4s ease-in-out infinite',
        'pulse-soft-luxury': 'pulse-soft-luxury 3s ease-in-out infinite',
        'shimmer-gold': 'shimmer-gold 2.5s infinite linear',
        'spin-slow': 'spin-slow 8s linear infinite',
        'gold-pulse': 'gold-pulse 3s ease-in-out infinite',
        'particles-float': 'particles-float 20s linear infinite',
      },

      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-luxury-mesh': 'radial-gradient(ellipse at 20% 30%, rgba(212, 175, 55, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(212, 175, 55, 0.1) 0%, transparent 50%), radial-gradient(ellipse at 40% 80%, rgba(212, 175, 55, 0.08) 0%, transparent 50%), linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)',
        'gradient-gold': 'linear-gradient(135deg, #d4af37 0%, #f4c542 25%, #c9a227 50%, #d4af37 75%, #f4c542 100%)',
        'gradient-gold-subtle': 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(244, 197, 66, 0.2) 50%, rgba(201, 162, 39, 0.3) 100%)',
        'gradient-luxury': 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2d2d2d 100%)',
      },

      fontFamily: {
        sans: [
          'var(--font-inter)',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        display: [
          'var(--font-playfair)',
          'var(--font-inter)',
          'system-ui',
          'sans-serif',
        ],
      },

      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },

      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'ease-out-quint': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'ease-in-quint': 'cubic-bezier(0.64, 0, 0.78, 0)',
        'ease-luxury': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

export default config
