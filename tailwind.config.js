/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        light: {
          background: '#F9FAFB',
          text: '#1F2937',
          primary: '#1E3A8A',
          'primary-hover': '#3B82F6',
          secondary: '#4B5563',
          'table-header': '#E0E7FF',
          'row-hover': '#EFF6FF',
          success: '#DCFCE7',
          'success-text': '#166534',
          danger: '#FEE2E2',
          'danger-text': '#991B1B',
        },
        dark: {
          background: '#1F2937',    // gray-800
          text: '#E5E7EB',         // gray-200
          primary: '#3B82F6',
          'primary-hover': '#60A5FA',
          secondary: '#9CA3AF',    // gray-400
          'table-header': '#374151', // gray-700
          'row-hover': '#4B5563',  // gray-600
          success: '#34D399',      // green-400
          'success-text': '#064E3B', // green-900
          danger: '#F87171',       // red-400
          'danger-text': '#7F1D1D', // red-900
        },
      },
    },
  },
  plugins: [],
};