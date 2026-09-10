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
        command: {
          bg: "#F4F6F9",
          card: "#FFFFFF",
          border: "#E2E8F0",
          hover: "#F8FAFC",
          text: "#0F172A",
          muted: "#64748B",
          navy: "#0B3C74",
          govblue: "#1E3A8A",
          saffron: "#FF9933",
          green: "#138808",
        },
        brand: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
        },
        status: {
          critical: "#EF4444",
          high: "#F97316",
          medium: "#F59E0B",
          low: "#10B981",
          verified: "#3B82F6",
          resolved: "#059669",
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
