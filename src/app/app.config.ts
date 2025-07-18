import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { errorInterceptor } from './components/errors/error.interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';
import { registerLocaleData } from '@angular/common';
import localeEsMX from '@angular/common/locales/es-MX';

// Registrar el locale es-MX
registerLocaleData(localeEsMX);

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([errorInterceptor])), 
    provideRouter(routes),
    provideAnimations(),
    provideNativeDateAdapter(),
    { provide: LOCALE_ID, useValue: 'es-MX' }
  ]
};