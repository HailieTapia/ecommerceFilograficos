import { AbstractControl, ValidatorFn } from '@angular/forms';

// Validador personalizado para evitar caracteres peligrosos
export function noXSSValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    const forbidden = /<script>|<\/script>|<|>/i.test(control.value || '');
    return forbidden ? { xssDetected: true } : null;
  };
}

