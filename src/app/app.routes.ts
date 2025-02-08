import { Routes, RouterModule } from '@angular/router';
import { provideRouter } from '@angular/router';
import { RegisterComponent } from './components/public/register/register.component';
import { RecoverComponent } from './components/public/recover/recover.component';


import { BadRequestComponent } from './components/errors/bad-request/bad-request.component';
import { NotFoundComponent } from './components/errors/not-found/not-found.component';
import { ServerErrorComponent } from './components/errors/server-error/server-error.component';

export const routes: Routes = [
  { path: 'register', component: RegisterComponent },
  { path: 'recovery', component: RecoverComponent },
  { path: '', redirectTo: '/recovery', pathMatch: 'full' },
  
  // Ruta para el error 400 (por ejemplo, si el servidor devuelve un error)
  { path: '400', component: BadRequestComponent },
  // Ruta para otros errores como 404
  { path: '**', component: NotFoundComponent },
  // Ruta para el error 500 (por ejemplo, si el servidor devuelve un error)
  { path: '500', component: ServerErrorComponent },
];