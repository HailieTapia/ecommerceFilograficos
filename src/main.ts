import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Importar estilos de FullCalendar
import '@fullcalendar/core';
import '@fullcalendar/daygrid';
import '@fullcalendar/timegrid';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));