import type { Config } from 'tailwindcss';

/**
 * Shared Tailwind CSS preset for the Finance Manager platform.
 *
 * Maps the existing design tokens (spacing, border-radius, shadows, colours)
 * to Tailwind utility classes so that all applications share a single
 * source of truth.
 *
 * Usage in app-level tailwind.config.ts:
 *   import preset from '../../packages/ui/tailwind.preset';
 *   export default { presets: [preset], ... } satisfies Config;
 */
const preset: Config = {
  content: [],
  darkMode: 'class',
  theme: {
    extend: {
      /* ── Colours ─────────────────────────────────────────────── */
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
      },

      /* ── Border Radius (matches borderRadius tokens) ────────── */
      borderRadius: {
        lg: '12px',
        md: '6px',
        sm: '4px',
      },

      /* ── Shadows (matches shadows.elevated) ─────────────────── */
      boxShadow: {
        elevated: '0 4px 16px rgba(0, 0, 0, 0.08)',
      },

      /* ── Font Family ────────────────────────────────────────── */
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },

      /* ── Keyframes & Animations ─────────────────────────────── */
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
};

export default preset;
