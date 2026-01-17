import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import { typography, spacing, borderRadius } from "./src/lib/design-tokens";

// Shadow values (moved from design-tokens to avoid breaking changes)
const shadows = {
  none: 'none',
  level1: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  level2: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  level3: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  level4: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  level5: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};

export default {
  darkMode: ["class"],
  // Set dark mode as default
  // Users can override with class="light" on html element
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
        display: ['Inter', 'sans-serif'], // Can be replaced with a distinctive font
      },
      fontSize: {
        // Professional Typography Scale (from 032-professional-ui spec)
        'display-1': ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        'display-2': ['2rem', { lineHeight: '1.25', fontWeight: '600' }],
        'heading-1': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        'heading-2': ['1.25rem', { lineHeight: '1.35', fontWeight: '600' }],
        'heading-3': ['1.125rem', { lineHeight: '1.4', fontWeight: '500' }],
        'body-lg': ['1rem', { lineHeight: '1.6' }],
        'body': ['0.875rem', { lineHeight: '1.5' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.5' }],
        'caption': ['0.75rem', { lineHeight: '1.4' }],
        'caption-sm': ['0.6875rem', { lineHeight: '1.3' }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // NEW: Section-specific colors
        generate: {
          DEFAULT: "hsl(var(--generate))",
          glow: "hsl(var(--generate-glow))",
        },
        library: {
          DEFAULT: "hsl(var(--library))",
          glow: "hsl(var(--library-glow))",
        },
        projects: {
          DEFAULT: "hsl(var(--projects))",
          glow: "hsl(var(--projects-glow))",
        },
        community: {
          DEFAULT: "hsl(var(--community))",
          glow: "hsl(var(--community-glow))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          glow: "hsl(var(--success-glow))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          glow: "hsl(var(--warning-glow))",
        },
      },
      spacing: {
        // Semantic spacing tokens
        'touch': 'var(--touch-target-min)',
        'touch-lg': 'var(--touch-target-comfortable)',
        'touch-xl': 'var(--touch-target-large)',
        // Additional semantic spacing
        '4.5': '1.125rem', // 18px
        '5.5': '1.375rem', // 22px
        '13': '3.25rem',   // 52px
        '15': '3.75rem',   // 60px
        '18': '4.5rem',    // 72px
        'safe-bottom': 'max(var(--safe-area-bottom), 1rem)',
      },
      minHeight: {
        'touch': 'var(--touch-target-min)',
        'touch-lg': 'var(--touch-target-comfortable)',
        'touch-xl': 'var(--touch-target-large)',
      },
      minWidth: {
        'touch': 'var(--touch-target-min)',
        'touch-lg': 'var(--touch-target-comfortable)',
        'touch-xl': 'var(--touch-target-large)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      transitionDuration: {
        'instant': 'var(--duration-instant)',
        'fast': 'var(--duration-fast)',
        'normal': 'var(--duration-normal)',
        'slow': 'var(--duration-slow)',
        'slower': 'var(--duration-slower)',
        'slowest': 'var(--duration-slowest)',
      },
      transitionTimingFunction: {
        'default': 'var(--ease-default)',
        'bounce': 'var(--ease-bounce)',
        'spring': 'var(--ease-spring)',
      },
      backgroundImage: {
        'gradient-telegram': 'linear-gradient(135deg, hsl(207 90% 54%), hsl(250 80% 60%))',
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-card': 'var(--gradient-card)',
        'gradient-hero': 'var(--gradient-hero)',
        'gradient-generate': 'var(--gradient-generate)',
        'gradient-success': 'var(--gradient-success)',
      },
      boxShadow: {
        'glow': 'var(--shadow-glow)',
        'glow-sm': '0 0 15px 0 hsl(207 90% 54% / 0.2)',
        'glow-lg': '0 0 50px 0 hsl(207 90% 54% / 0.4)',
        'glow-generate': '0 0 30px 0 hsl(var(--generate) / 0.4)',
        // Design system elevation levels (feature 032-professional-ui)
        'elevation-0': shadows.none,
        'elevation-1': shadows.level1,
        'elevation-2': shadows.level2,
        'elevation-3': shadows.level3,
        'elevation-4': shadows.level4,
        'elevation-5': shadows.level5,
      },
      zIndex: {
        'base': '0',
        'raised': '10',
        'sticky': '20',
        'floating': '30',
        'overlay': '40',
        'navigation': '50',
        'player': '60',
        'contextual': '70',
        'dialog': '80',
        'fullscreen': '90',
        'system': '100',
        'dropdown': '200',
        // Specific component helpers
        'sheet-backdrop': '80',
        'sheet-content': '81',
        'player-overlay': '61',
        'toast': '70',
        'hint': '70',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 20px hsl(207 90% 54% / 0.4)",
          },
          "50%": {
            boxShadow: "0 0 30px hsl(207 90% 54% / 0.6)",
          },
        },
        "shimmer": {
          "0%": {
            transform: "translateX(-100%)",
          },
          "100%": {
            transform: "translateX(100%)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "shimmer": "shimmer 1.5s infinite",
        "float": "float 3s ease-in-out infinite",
        "slide-up": "slide-up-fade 0.4s ease-out forwards",
        "vinyl-spin": "vinyl-spin 3s linear infinite",
        "vinyl-spin-slow": "vinyl-spin 8s linear infinite",
        "pulse-ring": "pulse-ring 2s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
