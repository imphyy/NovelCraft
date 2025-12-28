/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Merriweather", "ui-serif", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },

      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },

        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        info: "hsl(var(--info))",

        // Theme-specific colors
        arcane: "#2F80ED",
        gold: "#E3B341",
      },

      borderRadius: {
        lg: "14px",  // Cards
        md: "var(--radius)",  // 10px - Buttons
        sm: "calc(var(--radius) - 2px)",
      },

      boxShadow: {
        soft: "var(--shadow-soft)",
        medium: "var(--shadow-medium)",
        strong: "var(--shadow-strong)",
        "glow-blue": "var(--shadow-glow-blue)",
        "glow-gold": "var(--shadow-glow-gold)",
        "glow-blue-hover": "0 10px 30px rgba(47, 128, 237, 0.55)",
        "glow-gold-hover": "0 10px 30px rgba(227, 179, 65, 0.55)",
      },

      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #2F80ED 0%, #38BDF8 100%)",
        "gradient-gold": "linear-gradient(135deg, #E3B341 0%, #F5D67B 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
