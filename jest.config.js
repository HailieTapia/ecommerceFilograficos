/** @type {import('jest').Config} */
const config = {
  // Configuración base para Angular y TypeScript
  preset: 'jest-preset-angular',
  
  // Archivo de setup que Jest debe ejecutar antes de los tests (ya creado)
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  
  // Patrones para ignorar durante la búsqueda de archivos de prueba
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/dist/",
    "<rootDir>/src/test.ts" // Ignoramos el setup de Karma
  ],
  
  // Archivos a transformar (compilador de TS y HTML/CSS)
  transform: {
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      {
        // IMPORTANTE: Apuntamos al nuevo archivo de configuración exclusivo de Jest
        tsconfig: '<rootDir>/tsconfig.jest.json', 
        stringifyContentPathRegex: '\\.(html|svg)$',
        useESM: true,
      },
    ],
  },
  
  // Mapeo de módulos para sustituir archivos durante las pruebas
  moduleNameMapper: {
    // AÑADIDO: Mock para el archivo de configuración de Firebase que causa el error.
    // Esto previene que se ejecute getMessaging() en el ambiente de Jest.
    'src/app/environments/firebase-config': '<rootDir>/__mocks__/firebase-config.mock.js',
  },
  
  // Para que Jest pueda importar módulos ES (como @fullcalendar)
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$|@fullcalendar|ng2-charts|lodash-es|chart\\.js)',
  ],  
  // Entorno de pruebas
  testEnvironment: 'jsdom',
  
  // Ajustes de cobertura (opcional, pero recomendado)
  collectCoverage: true,
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coverageDirectory: 'coverage/jest',
};

module.exports = config;
