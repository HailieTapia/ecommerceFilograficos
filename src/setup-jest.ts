import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

// Inicializa el ambiente de testing de Zone (Angular)
setupZoneTestEnv();

// Importa los matchers de DOM de Testing Library
import '@testing-library/jest-dom'; 

// ELIMINA la línea: import 'jest-preset-angular/setup-jest';
// Es la que está generando la advertencia de deprecación.