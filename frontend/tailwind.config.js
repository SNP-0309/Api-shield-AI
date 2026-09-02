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
        sentinel: {
          bg: '#F4F6FA',
          surface: '#FFFFFF',
          card: '#F8F9FC',
          hover: '#EEF0FA',
          border: '#E6E9F0',
          borderLight: '#CFD5E2',
          safe: '#10B981',
          safeBg: 'rgba(16, 185, 129, 0.12)',
          suspicious: '#F59E0B',
          suspiciousBg: 'rgba(245, 158, 11, 0.12)',
          highRisk: '#F97316',
          highRiskBg: 'rgba(249, 115, 22, 0.12)',
          critical: '#EF4444',
          criticalBg: 'rgba(239, 68, 68, 0.15)',
          accent: '#5B4BD8',
          accentCyan: '#0A9EA4',
          muted: '#7C8495'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      }
    },
  },
  plugins: [],
}
