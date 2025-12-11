/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
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
        brand: {
          50: '#eff4ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        slate: {
          850: '#151F32',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'glass': '0 8px 30px rgba(0, 0, 0, 0.12)',
        'glass-sm': '0 4px 20px rgba(0, 0, 0, 0.1)',
        'neon': '0 0 20px -5px hsl(var(--primary) / 0.5)',
        'dark-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fade-in": {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "fade-out": {
          "0%": { opacity: 1, transform: "translateY(0)" },
          "100%": { opacity: 0, transform: "translateY(-10px)" },
        },
        "slide-in-right": {
          "0%": { opacity: 0, transform: "translateX(100%)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
        "slide-out-right": {
          "0%": { opacity: 1, transform: "translateX(0)" },
          "100%": { opacity: 0, transform: "translateX(100%)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.5 },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        floatSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scan: {
          '0%, 100%': { top: '-10%', opacity: 0 },
          '15%': { opacity: 1 },
          '85%': { opacity: 1 },
          '100%': { top: '110%', opacity: 0 },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        dragDrop: {
          '0%': { transform: 'translate(0, 0) rotate(0deg)', zIndex: '20' },
          '10%': { transform: 'translate(0, 0) rotate(0deg)', zIndex: '20' },
          '15%': { transform: 'translate(0, -5px) rotate(2deg) scale(1.02)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)', zIndex: '50' },
          '50%': { transform: 'translate(120px, -5px) rotate(2deg) scale(1.02)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)', zIndex: '50' },
          '60%': { transform: 'translate(120px, 0) rotate(0deg) scale(1)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: '20' },
          '85%': { transform: 'translate(120px, 0)', opacity: '1' },
          '90%': { transform: 'translate(120px, 0)', opacity: '0' },
          '95%': { transform: 'translate(0, 0)', opacity: '0' },
          '100%': { transform: 'translate(0, 0)', opacity: '1' }
        },
        pulseRing: {
          '0%': { transform: 'scale(0.8)', opacity: '0.4' },
          '100%': { transform: 'scale(2.2)', opacity: '0' }
        },
        wave: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        cursorMove: {
          '0%': { transform: 'translate(20px, 40px)', opacity: '0' },
          '5%': { transform: 'translate(20px, 40px)', opacity: '1' },
          '10%': { transform: 'translate(0, 0)', opacity: '1' },
          '12%': { transform: 'scale(0.9)' },
          '15%': { transform: 'scale(1)' },
          '50%': { transform: 'translate(120px, 0)', opacity: '1' },
          '60%': { transform: 'translate(120px, 10px)', opacity: '1' },
          '85%': { opacity: '1' },
          '90%': { opacity: '0' },
          '100%': { opacity: '0', transform: 'translate(20px, 40px)' }
        },
        type: {
          '0%': { width: '0' },
          '10%': { width: '0' },
          '50%': { width: '100%' },
          '90%': { width: '100%' },
          '100%': { width: '0' }
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-out-right": "slide-out-right 0.3s ease-out",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 3s infinite",
        "float-slow": "float 8s ease-in-out infinite",
        "float-fast": "float 4s ease-in-out infinite",
        "float-subtle": "floatSubtle 5s ease-in-out infinite",
        "marquee": "marquee 40s linear infinite",
        "fade-in-up": "fadeInUp 0.8s ease-out forwards",
        "scan": "scan 3s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "drag-drop": "dragDrop 4s ease-in-out infinite",
        "pulse-ring": "pulseRing 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "wave": "wave 15s linear infinite",
        "wave-slow": "wave 25s linear infinite",
        "wave-slower": "wave 35s linear infinite",
        "breathe": "breathe 4s ease-in-out infinite",
        "cursor-move": "cursorMove 4s ease-in-out infinite",
        "type": "type 4s steps(20) infinite",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      minHeight: {
        'screen-safe': 'calc(100vh - 4rem)',
      },
      backdropBlur: {
        xs: '2px',
      },
      screens: {
        'xs': '475px',
        // => @media (min-width: 475px) { ... }
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
