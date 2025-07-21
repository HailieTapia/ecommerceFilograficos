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
          fondo: '#ccdaeb',
          encabezado: '#001e70', 
          pie: '#191c33', 
          texto: '#0390b7', 
          blanco: '#ffffff', 
          negro: '#000000',
          azulclaro: '#204fdbff',
          azulmasclaro: '#3462ecff',
          gris: '#4b5563',
          verde: '#22c55a',
          'verde-fuerte': '#225028ff',
          background: '#f3f7fb',
          text: '#1F2937',
          primary: '#1E3A8A',
          'primary-hover': '#0034b0',
          secondary: '#4B5563',
          'secondary-hover': '#6B7280',
          'table-header': '#9ac7ecff',
          'row-hover': '#EFF6FF',
          success: '#DCFCE7',          // Activo
          'success-text': '#166534',
          danger: '#E63946 ',           // Inactivo
          'danger-text': '#6D1B1B  ',
          'danger-hover': '#FF6B6B  ',
          pending: '#FACC15',          // Pendiente (amarillo suave)
          'pending-text': '#92400E',
          closed: '#E5E7EB',           // Cerrado (gris claro)
          'closed-text': '#4B5563',
          'in-progress': '#DBEAFE',    // En Proceso (azul suave)
          'in-progress-text': '#1E3A8A',
          resolved: '#D1FAE5',         // Resuelto (verde más suave que success)
          'resolved-text': '#065F46',
          disabled: '#D1D5DB', // Gris claro para modo claro
          'disabled-text': '#9CA3AF',
        },
        dark: {
          background: '#111827',
          text: '#E5E7EB',
          primary: '#3B82F6',
          'primary-hover': '#60A5FA',
          secondary: '#9CA3AF',
          'secondary-hover': '#D1D5DB',
          'table-header': '#374151',
          'row-hover': '#4B5563',
          success: '#34D399',          // Activo
          'success-text': '#064E3B',
          danger: '#C53030 ',           // Inactivo
          'danger-text': '#FF9E9E    ',
          'danger-hover': '#E53E3E ',
          pending: '#D97706',          // Pendiente (amarillo oscuro)
          'pending-text': '#FEF3C7',
          closed: '#6B7280',           // Cerrado (gris medio)
          'closed-text': '#E5E7EB',
          'in-progress': '#60A5FA',    // En Proceso (azul claro)
          'in-progress-text': '#1E3A8A',
          resolved: '#10B981',         // Resuelto (verde más oscuro que success)
          'resolved-text': '#D1FAE5',
          disabled: '#4B5563', // Gris oscuro para modo oscuro
          'disabled-text': '#6B7280',
        },
      },
      fontWeight: {
        550: '550'
      }
    },
  },
  plugins: [],
};