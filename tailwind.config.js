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
        brand: {
          amber: 'hsl(var(--color-brand-amber) / <alpha-value>)',
          navy: 'hsl(var(--color-brand-navy) / <alpha-value>)',
          'amber-light': 'hsl(var(--color-brand-amber-light) / <alpha-value>)',
          'amber-dark': 'hsl(var(--color-brand-amber-dark) / <alpha-value>)',
        },
        status: {
          running: 'hsl(var(--color-status-running) / <alpha-value>)',
          full: 'hsl(var(--color-status-full) / <alpha-value>)',
          breakdown: 'hsl(var(--color-status-breakdown) / <alpha-value>)',
          stale: 'hsl(var(--color-status-stale) / <alpha-value>)',
        },
        surface: {
          light: 'hsl(var(--color-surface-light) / <alpha-value>)',
          card: 'hsl(var(--color-surface-card) / <alpha-value>)',
          dark: 'hsl(var(--color-surface-dark) / <alpha-value>)',
          darkcard: 'hsl(var(--color-surface-darkcard) / <alpha-value>)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'float': '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
        'sheet': '0 -10px 30px -5px rgba(15, 23, 42, 0.15)',
      }
    },
  },
  plugins: [],
}

