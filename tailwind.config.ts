import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        // Cards (rounded-lg = 8px) e botões (rounded-md = 6px)
        lg: "8px",
        md: "6px",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        popover: "var(--popover)",
        "popover-foreground": "var(--popover-foreground)",
        "primary-foreground": "var(--primary-foreground)",
        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        destructive: "var(--destructive)",
        "destructive-foreground": "var(--destructive-foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        "chart-1": "var(--chart-1)",
        "chart-2": "var(--chart-2)",
        "chart-3": "var(--chart-3)",
        "chart-4": "var(--chart-4)",
        "chart-5": "var(--chart-5)",
        sidebar: "var(--sidebar)",
        "sidebar-foreground": "var(--sidebar-foreground)",
        "sidebar-primary": "var(--sidebar-primary)",
        "sidebar-primary-foreground": "var(--sidebar-primary-foreground)",
        "sidebar-accent": "var(--sidebar-accent)",
        "sidebar-accent-foreground": "var(--sidebar-accent-foreground)",
        "sidebar-border": "var(--sidebar-border)",
        "sidebar-ring": "var(--sidebar-ring)",
        // Palette scales (usadas pelos tokens semânticos da UI)
        primary: {
          DEFAULT: "#4F46E5",
          50: "#EEF0FF",
          100: "#C7D0FE",
          200: "#A5B4FC",
          400: "#818CF8",
          600: "#4F46E5",
          800: "#3730A3",
          900: "#1E1B6E",
        },
        success: {
          50: "#ECFDF5",
          100: "#A7F3D0",
          400: "#34D399",
          600: "#059669",
          800: "#065F46",
        },
        warning: {
          50: "#FFFBEB",
          100: "#FDE68A",
          400: "#FBBF24",
          600: "#D97706",
          800: "#92400E",
        },
        danger: {
          50: "#FFF1F2",
          100: "#FECDD3",
          400: "#FB7185",
          600: "#E11D48",
          800: "#9F1239",
        },
        neutral: {
          50: "#F8FAFC",
          100: "#E2E8F0",
          200: "#CBD5E1",
          400: "#94A3B8",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
        indigoViolet: "#6D28D9",
      },
    },
  },
  plugins: [],
};

export default config;

