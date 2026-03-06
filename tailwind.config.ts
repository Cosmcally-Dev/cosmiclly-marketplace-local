import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Lora', 'serif'],
        serif: ['Lora', 'serif'],
        heading: ['Lora', 'serif'],
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
        blood: {
          deep: "hsl(var(--blood-deep))",
          dark: "hsl(var(--blood-dark))",
          vibrant: "hsl(var(--blood-vibrant))",
          black: "hsl(var(--blood-black))",
        },
        platinum: "hsl(var(--platinum))",
        "ghost-white": "hsl(var(--ghost-white))",
        status: {
          online: "hsl(160 84% 39%)",
          busy: "hsl(var(--busy-orange))",
          offline: "hsl(var(--offline-gray))",
        },
        cyan: {
          500: "hsl(187 94% 43%)",
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
      },
      fontSize: {
        /* Nudge up the two smallest steps for modern readability */
        xs:   ['0.8125rem', { lineHeight: '1.4' }],   /* 13px  (was 12px) */
        sm:   ['0.9375rem', { lineHeight: '1.5' }],   /* 15px  (was 14px) */
        base: ['1rem',      { lineHeight: '1.65' }],  /* 16px — keep */
        lg:   ['1.125rem',  { lineHeight: '1.55' }],  /* 18px — keep */
        xl:   ['1.25rem',   { lineHeight: '1.45' }],  /* 20px — keep */
        '2xl':['1.5rem',    { lineHeight: '1.35' }],  /* 24px — keep */
        '3xl':['1.875rem',  { lineHeight: '1.25' }],  /* 30px — keep */
        '4xl':['2.25rem',   { lineHeight: '1.15' }],  /* 36px — keep */
        '5xl':['3rem',      { lineHeight: '1.1'  }],  /* 48px — keep */
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite linear",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "slide-in-right": "slide-in-right 0.3s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
