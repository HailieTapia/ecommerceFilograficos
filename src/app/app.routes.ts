import { Routes, RouterModule } from '@angular/router';
import { provideRouter } from '@angular/router';
import { RegisterComponent } from './components/register/register.component'; 

export const routes: Routes = [
    { path: 'register', component: RegisterComponent },
    { path: '', redirectTo: '/register', pathMatch: 'full' } // Asegúrate de que la ruta raíz redirija a /register
  ];