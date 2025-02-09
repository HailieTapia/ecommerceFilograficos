import { Routes, RouterModule } from '@angular/router';
//publicos
import { RegisterComponent } from './components/public/register/register.component';
import { RecoverComponent } from './components/public/recover/recover.component';
import { LoginComponent } from './components/public/login/login.component';

//autenticados
import { ProfileComponent } from './components/authenticated/profile/profile.component';


//errores
import { BadRequestComponent } from './components/errors/bad-request/bad-request.component';
import { NotFoundComponent } from './components/errors/not-found/not-found.component';
import { ServerErrorComponent } from './components/errors/server-error/server-error.component';

export const routes: Routes = [
  //autenticados
  { path: 'profile', component: ProfileComponent },

  //publicos
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'recovery', component: RecoverComponent },
  { path: '', redirectTo: '/profile', pathMatch: 'full' },
  
  // Ruta para el error 400 (Bad Request)
  { path: '400', component: BadRequestComponent },
  // Ruta para el error 404 (Not Found)
  { path: '404', component: NotFoundComponent },
  // Ruta para el error 500 (Internal Server Error)
  { path: '500', component: ServerErrorComponent },
  // Ruta comodín para otros errores (puedes redirigir aquí en caso de que sea necesario)
  { path: '**', component: NotFoundComponent },
];
