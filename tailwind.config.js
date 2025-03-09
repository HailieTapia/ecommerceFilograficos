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
            'secondary-hover': '#6B7280',
            'table-header': '#E0E7FF',
            'row-hover': '#EFF6FF',
            success: '#DCFCE7',          // Activo
            'success-text': '#166534',
            danger: '#FEE2E2',           // Inactivo
            'danger-text': '#991B1B',
            'danger-hover': '#FCA5A5',
            pending: '#FEF3C7',          // Pendiente (amarillo suave)
            'pending-text': '#92400E',
            closed: '#E5E7EB',           // Cerrado (gris claro)
            'closed-text': '#4B5563',
            'in-progress': '#DBEAFE',    // En Proceso (azul suave)
            'in-progress-text': '#1E3A8A',
            resolved: '#D1FAE5',         // Resuelto (verde más suave que success)
            'resolved-text': '#065F46'
          },
          dark: {
            background: '#1F2937', 
            text: '#E5E7EB', 
            primary: '#3B82F6',
            'primary-hover': '#60A5FA',
            secondary: '#9CA3AF', 
            'secondary-hover': '#D1D5DB',
            'table-header': '#374151',
            'row-hover': '#4B5563',
            success: '#34D399',          // Activo
            'success-text': '#064E3B',
            danger: '#F87171',           // Inactivo
            'danger-text': '#7F1D1D', 
            'danger-hover': '#FCA5A5',
            pending: '#D97706',          // Pendiente (amarillo oscuro)
            'pending-text': '#FEF3C7',
            closed: '#6B7280',           // Cerrado (gris medio)
            'closed-text': '#E5E7EB',
            'in-progress': '#60A5FA',    // En Proceso (azul claro)
            'in-progress-text': '#1E3A8A',
            resolved: '#10B981',         // Resuelto (verde más oscuro que success)
            'resolved-text': '#D1FAE5'
        },
      },
    },
  },
  plugins: [],
};