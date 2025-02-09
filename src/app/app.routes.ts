import { Routes, RouterModule } from '@angular/router';
import { RegisterComponent } from './components/public/register/register.component';
import { RecoverComponent } from './components/public/recover/recover.component';

import { BadRequestComponent } from './components/errors/bad-request/bad-request.component';
import { NotFoundComponent } from './components/errors/not-found/not-found.component';
import { ServerErrorComponent } from './components/errors/server-error/server-error.component';

export const routes: Routes = [
  { path: 'register', component: RegisterComponent },
  { path: 'recovery', component: RecoverComponent },
  { path: '', redirectTo: '/recovery', pathMatch: 'full' },
  
  // Ruta para el error 400 (Bad Request)
  { path: '400', component: BadRequestComponent },
  // Ruta para el error 404 (Not Found)
  { path: '404', component: NotFoundComponent },
  // Ruta para el error 500 (Internal Server Error)
  { path: '500', component: ServerErrorComponent },
  // Ruta comodín para otros errores (puedes redirigir aquí en caso de que sea necesario)
  { path: '**', component: NotFoundComponent },
];
