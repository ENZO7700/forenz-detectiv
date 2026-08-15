/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        glass: {
          light: 'rgba(255, 255, 255, 0.72)',
          dark: 'rgba(15, 23, 42, 0.78)',
          card: 'rgba(255, 255, 255, 0.65)',
          'card-dark': 'rgba(30, 41, 59, 0.70)',
          border: 'rgba(255, 255, 255, 0.40)',
          'border-dark': 'rgba(255, 255, 255, 0.12)',
          glow: 'rgba(59, 130, 246, 0.25)',
          'glow-red': 'rgba(239, 68, 68, 0.25)'
        },
        forensic: {
          navy: '#0b3b8c',
          blue: '#2563eb',
          crimson: '#ee1c25',
          gold: '#f59e0b',
          slate: '#0f172a',
          frost: '#f8fafc'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        }
      },
      boxShadow: {
        'glass-sm': '0 4px 12px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
        'glass': '0 12px 32px rgba(11, 59, 140, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04), inset 0 1px 1.5px rgba(255, 255, 255, 0.6)',
        'glass-lg': '0 24px 64px rgba(11, 59, 140, 0.14), 0 8px 24px rgba(0, 0, 0, 0.06), inset 0 1.5px 2px rgba(255, 255, 255, 0.7)',
        'glass-dark': '0 12px 32px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
        'glow-blue': '0 0 24px rgba(37, 99, 235, 0.35)',
        'glow-red': '0 0 24px rgba(238, 28, 37, 0.35)',
        'glow-gold': '0 0 24px rgba(245, 158, 11, 0.35)'
      },
      backdropBlur: {
        'glass': '20px',
        '2xl': '32px',
        '3xl': '48px'
      },
      fontFamily: {
        heading: ['var(--font-heading)'],
        body: ['var(--font-body)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)']
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'glass-float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' }
        },
        'glass-shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'glass-float': 'glass-float 4s ease-in-out infinite',
        'glass-shimmer': 'glass-shimmer 2.5s infinite linear'
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};
