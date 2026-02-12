/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        muted: '#64748b',
        accent: '#2563eb',
        surface: '#ffffff',
        shell: '#f5f7fb',
        line: '#e2e8f0'
      },
      boxShadow: {
        soft: '0 20px 40px rgba(15, 23, 42, 0.08)'
      },
      borderRadius: {
        xl: '20px'
      }
    }
  },
  plugins: []
}
