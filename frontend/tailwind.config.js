/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#635BFF",
        "primary-dark": "#4F46E5",
        secondary: "#7C3AED",
        "accent-blue": "#3B82F6",
        background: "#0B0F19",
        surface: "#111827",
        "surface-elevated": "#1F2937",
        "surface-hover": "#1A2035",
        border: "#2A3245",
        "border-light": "#1F2937",
        success: "#10B981",
        danger: "#EF4444",
        warning: "#F59E0B",
        text: {
          main: "#F9FAFB",
          secondary: "#9CA3AF",
          muted: "#6B7280",
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'premium': '0 8px 32px -8px rgba(0, 0, 0, 0.3)',
        'premium-lg': '0 16px 48px -12px rgba(0, 0, 0, 0.4)',
        'glow-primary': '0 0 20px rgba(99, 91, 255, 0.15)',
        'glow-primary-lg': '0 0 40px rgba(99, 91, 255, 0.2)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
